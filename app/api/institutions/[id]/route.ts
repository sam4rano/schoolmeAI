import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"

const updateSchema = z.object({
  website: z.string().url().optional().nullable(),
  contact: z.record(z.any()).optional(),
  accreditationStatus: z.string().optional().nullable(),
  tuitionFees: z.record(z.any()).optional(),
  feesSchedule: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
      include: {
        programs: {
          orderBy: {
            name: "asc",
          },
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
    logger.error("Error fetching institution", error, {
      endpoint: `/api/institutions/${params.id}`,
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
    })

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.institution.update({
      where: { id: params.id },
      data: {
        website: validatedData.website ?? institution.website,
        contact: validatedData.contact
          ? { ...(institution.contact as any), ...validatedData.contact }
          : institution.contact,
        accreditationStatus:
          validatedData.accreditationStatus ?? institution.accreditationStatus,
        // tuitionFees and feesSchedule fields not in database yet - can be added later via admin
        // tuitionFees: (validatedData.tuitionFees ?? institution.tuitionFees) as any,
        // feesSchedule: (validatedData.feesSchedule ?? institution.feesSchedule) as any,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Institution updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error updating institution", error, {
      endpoint: `/api/institutions/${params.id}`,
      method: "PATCH",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


