import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { buildProgramQuery } from "@/lib/queries/programs"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"

const createProgramSchema = z.object({
  institutionId: z.string().uuid(),
  name: z.string().min(1),
  faculty: z.string().optional(),
  department: z.string().optional(),
  degreeType: z.string().optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  utmeSubjects: z.array(z.string()).optional(),
  olevelSubjects: z.array(z.string()).optional(),
  admissionRequirements: z.record(z.any()).optional(),
  cutoffHistory: z.array(z.any()).optional(),
  applicationDeadline: z.string().datetime().optional().or(z.literal("")),
  careerProspects: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const filters = {
      search: searchParams.get("search") || undefined,
      institutionId: searchParams.get("institutionId") || undefined,
      degreeType: searchParams.get("degreeType") || undefined,
      missingCutoff: searchParams.get("missingCutoff") === "true",
      missingDescription: searchParams.get("missingDescription") === "true",
    }

    const skip = (page - 1) * limit
    const query = buildProgramQuery(filters, {
      includeInstitution: true,
      institutionSelect: {
        id: true,
        name: true,
        type: true,
        state: true,
      },
      skip,
      take: limit,
    })

    const [programs, total] = await Promise.all([
      prisma.program.findMany(query),
      prisma.program.count({ where: query.where }),
    ])

    return NextResponse.json({
      data: programs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const data = createProgramSchema.parse(body)

    // Parse application deadline
    let applicationDeadline: Date | null = null
    if (data.applicationDeadline) {
      applicationDeadline = new Date(data.applicationDeadline)
    }

    const program = await prisma.program.create({
      data: {
        ...data,
        applicationDeadline,
        utmeSubjects: data.utmeSubjects || [],
        olevelSubjects: data.olevelSubjects || [],
        cutoffHistory: data.cutoffHistory || [],
        careerProspects: data.careerProspects || [],
      },
    })

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "program",
      entityId: program.id,
      action: "create",
      programId: program.id,
    })

    return NextResponse.json({ data: program }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

