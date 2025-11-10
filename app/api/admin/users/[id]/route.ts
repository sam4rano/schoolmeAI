import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"

const updateUserSchema = z.object({
  roles: z.array(z.string()).optional(),
  profile: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        roles: true,
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

    const [
      watchlistItems,
      calculations,
      reviews,
      questions,
      answers,
      forumPosts,
      forumComments,
      userStories,
      notifications,
    ] = await Promise.all([
      prisma.applicationsWatchlist.count({ where: { userId: user.id } }),
      (prisma as any).calculation.count({ where: { userId: user.id } }),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.question.count({ where: { userId: user.id } }),
      prisma.answer.count({ where: { userId: user.id } }),
      prisma.forumPost.count({ where: { userId: user.id } }),
      prisma.forumComment.count({ where: { userId: user.id } }),
      prisma.userStory.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        profile: user.profile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: {
          watchlistItems,
          calculations,
          reviews,
          questions,
          answers,
          forumPosts,
          forumComments,
          userStories,
          notifications,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { roles: true, profile: true },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (validatedData.roles !== undefined) {
      updateData.roles = validatedData.roles
    }

    if (validatedData.profile !== undefined) {
      const existingProfile = (existingUser.profile as any) || {}
      updateData.profile = {
        ...existingProfile,
        ...validatedData.profile,
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        roles: true,
        profile: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      data: user,
      message: "User updated successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: "User deleted successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

