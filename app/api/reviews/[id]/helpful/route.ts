import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/utils/api-error-handler"

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

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    // Increment helpful count
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      data: updatedReview,
      message: "Marked as helpful",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

