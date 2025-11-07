import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"

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
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error fetching program:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
      },
    })
    await prisma.auditEvent.create({
      data: {
        entityType: "program",
        entityId: program.id,
        action: "update",
        userId: session.user.id,
        programId: program.id,
        metadata: { changes },
      },
    })

    return NextResponse.json({ data: program })
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

    console.error("Error updating program:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
    await prisma.auditEvent.create({
      data: {
        entityType: "program",
        entityId: params.id,
        action: "delete",
        userId: session.user.id,
        programId: params.id,
      },
    })

    return NextResponse.json({ message: "Program deleted successfully" })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error deleting program:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

