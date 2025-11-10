import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { z } from "zod"

const updateWatchlistSchema = z.object({
  priority: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().optional().nullable(),
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

    // Verify the watchlist item belongs to the user
    const watchlistItem = await prisma.applicationsWatchlist.findUnique({
      where: { id: params.id },
    })

    if (!watchlistItem) {
      return NextResponse.json(
        { error: "Watchlist item not found" },
        { status: 404 }
      )
    }

    if (watchlistItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateWatchlistSchema.parse(body)

    const updated = await prisma.applicationsWatchlist.update({
      where: { id: params.id },
      data: {
        priority: validatedData.priority,
        notes: validatedData.notes,
      },
      include: {
        program: {
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
        },
      },
    })

    return NextResponse.json({
      message: "Watchlist item updated",
      data: updated,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error updating watchlist", error, {
      endpoint: `/api/watchlist/${params.id}`,
      method: "PATCH",
    })
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify the watchlist item belongs to the user
    const watchlistItem = await prisma.applicationsWatchlist.findUnique({
      where: { id: params.id },
    })

    if (!watchlistItem) {
      return NextResponse.json(
        { error: "Watchlist item not found" },
        { status: 404 }
      )
    }

    if (watchlistItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    await prisma.applicationsWatchlist.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Watchlist item removed" })
  } catch (error) {
    logger.error("Error removing from watchlist", error, {
      endpoint: `/api/watchlist/${params.id}`,
      method: "DELETE",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


