import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"

const updateProgramSchema = z.object({
  institutionId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
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
  courseCurriculum: z.record(z.any()).optional(),
  accreditationStatus: z.string().optional(),
  accreditationMaturityDate: z.number().int().min(2000).max(2100).optional().nullable(),
  accreditationLastUpdated: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            ownership: true,
            state: true,
          },
        },
      },
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: program })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const data = updateProgramSchema.parse(body)

    // Get existing program to track changes
    const existing = await prisma.program.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    // Parse application deadline
    let applicationDeadline: Date | null | undefined = undefined
    if (data.applicationDeadline !== undefined) {
      applicationDeadline = data.applicationDeadline ? new Date(data.applicationDeadline) : null
    }

    // Parse accreditation last updated
    let accreditationLastUpdated: Date | null | undefined = undefined
    if (data.accreditationLastUpdated !== undefined) {
      accreditationLastUpdated = data.accreditationLastUpdated
        ? new Date(data.accreditationLastUpdated)
        : null
    } else if (data.accreditationStatus !== undefined || data.accreditationMaturityDate !== undefined) {
      // Auto-update accreditationLastUpdated when accreditation fields change
      accreditationLastUpdated = new Date()
    }

    // Track changes
    const changes: Record<string, { old: any; new: any }> = {}
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined) {
        const oldValue = existing[key as keyof typeof existing]
        const newValue = data[key as keyof typeof data]
        
        // Deep comparison for arrays and objects
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[key] = {
            old: oldValue,
            new: newValue,
          }
        }
      }
    })

    const program = await prisma.program.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(applicationDeadline !== undefined && { applicationDeadline }),
        ...(accreditationLastUpdated !== undefined && { accreditationLastUpdated }),
      },
    })
    await logAuditEvent({
      userId: session.user.id,
      entityType: "program",
      entityId: program.id,
      action: "update",
      programId: program.id,
      metadata: { changes },
    })

    return NextResponse.json({ data: program })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()
    
    const program = await prisma.program.findUnique({
      where: { id: params.id },
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    await prisma.program.delete({
      where: { id: params.id },
    })

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "program",
      entityId: params.id,
      action: "delete",
      programId: params.id,
    })

    return NextResponse.json({ message: "Program deleted successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

