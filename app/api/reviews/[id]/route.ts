import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { requireAdmin } from "@/lib/middleware/admin"
import { logAuditEvent } from "@/lib/utils/audit-logger"

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().optional(),
  content: z.string().min(10).max(2000).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateReviewSchema.parse(body)

    // Get existing review
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    // Check if user owns the review or is admin
    const isAdmin = session.user.roles?.includes("admin")
    if (review.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. You can only update your own reviews." },
        { status: 403 }
      )
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        status: isAdmin ? review.status : "pending", // Re-moderate if user updates
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    })

    // Log audit event
    if (isAdmin) {
      await logAuditEvent({
        entityType: "program", // Use program as entity type for audit
        entityId: review.programId || review.institutionId || params.id,
        action: "update",
        userId: session.user.id,
        programId: review.programId || undefined,
        institutionId: review.institutionId || undefined,
        metadata: {
          reviewId: params.id,
          changes: validatedData,
        },
      })
    }

    return NextResponse.json({
      data: updatedReview,
      message: "Review updated successfully",
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    // Check if user owns the review or is admin
    const isAdmin = session.user.roles?.includes("admin")
    if (review.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own reviews." },
        { status: 403 }
      )
    }

    await prisma.review.delete({
      where: { id: params.id },
    })

    // Log audit event
    if (isAdmin) {
      await logAuditEvent({
        entityType: review.programId ? "program" : "institution",
        entityId: review.programId || review.institutionId || params.id,
        action: "delete",
        userId: session.user.id,
        programId: review.programId || undefined,
        institutionId: review.institutionId || undefined,
        metadata: {
          reviewId: params.id,
        },
      })
    }

    return NextResponse.json({
      message: "Review deleted successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Moderation endpoints (admin only)
const moderateReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "flagged"]),
  moderationNotes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const validatedData = moderateReviewSchema.parse(body)

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        moderationNotes: validatedData.moderationNotes,
        moderatedBy: session.user.id,
        moderatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    })

    // Log audit event
    await logAuditEvent({
      entityType: review.programId ? "program" : "institution",
      entityId: review.programId || review.institutionId || params.id,
      action: "update",
      userId: session.user.id,
      programId: review.programId || undefined,
      institutionId: review.institutionId || undefined,
      metadata: {
        reviewId: params.id,
        moderationStatus: validatedData.status,
        moderationNotes: validatedData.moderationNotes,
      },
    })

    return NextResponse.json({
      data: updatedReview,
      message: "Review moderated successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

