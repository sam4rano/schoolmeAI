import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { requireAuth } from "@/lib/middleware/auth"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/constants/notifications"

const notificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  deadlineReminders: z.boolean().optional(),
  watchlistUpdates: z.boolean().optional(),
  newPrograms: z.boolean().optional(),
  cutoffUpdates: z.boolean().optional(),
  feeUpdates: z.boolean().optional(),
  general: z.boolean().optional(),
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
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const profile = (user.profile as any) || {}
    const preferences = profile.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES

    return NextResponse.json({
      data: preferences,
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
    const validatedData = notificationPreferencesSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const existingProfile = (user.profile as any) || {}
    const existingPreferences = existingProfile.notificationPreferences || {
      email: true,
      push: false,
      deadlineReminders: true,
      watchlistUpdates: true,
      newPrograms: true,
      cutoffUpdates: true,
      feeUpdates: true,
      general: true,
    }

    const updatedPreferences = {
      ...existingPreferences,
      ...validatedData,
    }

    const updatedProfile = {
      ...existingProfile,
      notificationPreferences: updatedPreferences,
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profile: updatedProfile,
      },
    })

    return NextResponse.json({
      data: updatedPreferences,
      message: "Notification preferences updated successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

