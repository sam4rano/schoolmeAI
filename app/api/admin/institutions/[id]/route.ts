import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"

const updateInstitutionSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["university", "polytechnic", "college", "nursing", "military"]).optional(),
  ownership: z.enum(["federal", "state", "private"]).optional(),
  state: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  website: z.string().url().optional().or(z.literal("")),
  contact: z.record(z.any()).optional(),
  accreditationStatus: z.string().optional(),
  tuitionFees: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
      include: {
        programs: {
          select: {
            id: true,
            name: true,
            degreeType: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: { programs: true },
        },
      },
    })

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: institution })
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
    const data = updateInstitutionSchema.parse(body)

    // Get existing institution to track changes
    const existing = await prisma.institution.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      )
    }

    // Normalize website URL
    let website = data.website
    if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
      website = "https://" + website
    }

    // Track changes
    const changes: Record<string, { old: any; new: any }> = {}
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined && data[key as keyof typeof data] !== existing[key as keyof typeof existing]) {
        changes[key] = {
          old: existing[key as keyof typeof existing],
          new: data[key as keyof typeof data],
        }
      }
    })

    const institution = await prisma.institution.update({
      where: { id: params.id },
      data: {
        ...data,
        website: website !== undefined ? (website || null) : undefined,
      },
    })

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "institution",
      entityId: institution.id,
      action: "update",
      institutionId: institution.id,
      metadata: { changes },
    })

    return NextResponse.json({ data: institution })
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
    
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
    })

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      )
    }

    await prisma.institution.delete({
      where: { id: params.id },
    })

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "institution",
      entityId: params.id,
      action: "delete",
      institutionId: params.id,
    })

    return NextResponse.json({ message: "Institution deleted successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

