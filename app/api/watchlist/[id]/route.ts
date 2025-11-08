import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"

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


