import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"

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
    const search = searchParams.get("search") || ""
    const institutionId = searchParams.get("institutionId")
    const degreeType = searchParams.get("degreeType")
    const missingCutoff = searchParams.get("missingCutoff") === "true"
    const missingDescription = searchParams.get("missingDescription") === "true"

    const where: any = {}
    
    if (institutionId) {
      where.institutionId = institutionId
    }
    
    if (degreeType && degreeType !== "all") {
      where.degreeType = degreeType
    }
    
    if (missingCutoff) {
      where.cutoffHistory = null as any
    }
    
    if (missingDescription) {
      where.OR = [
        { description: null } as any,
        { description: "" } as any,
      ]
    }
    
    if (search) {
      const searchConditions = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          institution: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ]
      
      if (where.OR) {
        // Combine with existing OR conditions
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ]
        delete where.OR
      } else {
        where.OR = searchConditions
      }
    }

    const skip = (page - 1) * limit

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        skip,
        take: limit,
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              type: true,
              state: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.program.count({ where }),
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
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error fetching programs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
    await prisma.auditEvent.create({
      data: {
        entityType: "program",
        entityId: program.id,
        action: "create",
        userId: session.user.id,
        programId: program.id,
      },
    })

    return NextResponse.json({ data: program }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating program:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

