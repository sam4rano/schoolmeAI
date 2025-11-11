import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/middleware/auth"

const updateWatchlistSchema = z.object({
  priority: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const validatedData = updateWatchlistSchema.parse(body)

    // Verify ownership
    const watchlistItem = await (prisma as any).institutionWatchlist.findUnique({
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
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const updated = await (prisma as any).institutionWatchlist.update({
      where: { id: params.id },
      data: {
        ...(validatedData.priority !== undefined && { priority: validatedData.priority }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            ownership: true,
            state: true,
            city: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: updated,
      message: "Watchlist item updated",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error updating institution watchlist", error, {
      endpoint: "/api/watchlist/institutions/[id]",
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
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    // Verify ownership
    const watchlistItem = await (prisma as any).institutionWatchlist.findUnique({
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
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    await (prisma as any).institutionWatchlist.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: "Institution removed from watchlist",
    })
  } catch (error) {
    logger.error("Error deleting institution from watchlist", error, {
      endpoint: "/api/watchlist/institutions/[id]",
      method: "DELETE",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

