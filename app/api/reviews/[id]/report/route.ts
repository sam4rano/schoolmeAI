import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"

const reportReviewSchema = z.object({
  reason: z.string().min(5).max(500),
})

export async function POST(
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
    const validatedData = reportReviewSchema.parse(body)

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    // Increment reported count and flag if threshold reached
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        reportedCount: {
          increment: 1,
        },
        status: "flagged", // Auto-flag if reported
      },
    })

    // Log report (could be stored in a separate reports table)
    // For now, we'll just increment the count

    return NextResponse.json({
      data: updatedReview,
      message: "Review reported. It will be reviewed by moderators.",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

