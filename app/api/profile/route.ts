import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { requireAuth } from "@/lib/middleware/auth"

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  stateOfOrigin: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const profile = user.profile as any || {}
    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: profile.name || "",
        stateOfOrigin: profile.stateOfOrigin || "",
        dateOfBirth: profile.dateOfBirth || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: true },
    })

    const existingProfile = (existingUser?.profile as any) || {}
    const updatedProfile = {
      ...existingProfile,
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.stateOfOrigin !== undefined && { stateOfOrigin: validatedData.stateOfOrigin }),
      ...(validatedData.dateOfBirth !== undefined && { dateOfBirth: validatedData.dateOfBirth }),
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profile: updatedProfile,
      },
      select: {
        id: true,
        email: true,
        profile: true,
        updatedAt: true,
      },
    })

    const profile = user.profile as any || {}
    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: profile.name || "",
        stateOfOrigin: profile.stateOfOrigin || "",
        dateOfBirth: profile.dateOfBirth || "",
        updatedAt: user.updatedAt,
      },
      message: "Profile updated successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

