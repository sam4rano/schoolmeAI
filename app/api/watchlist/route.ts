import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/middleware/auth"

const watchlistSchema = z.object({
  programId: z.string().uuid(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().optional().nullable(),
})

const bulkAddSchema = z.object({
  programIds: z.array(z.string().uuid()).min(1).max(50),
  priority: z.enum(["high", "medium", "low"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const watchlistItems = await prisma.applicationsWatchlist.findMany({
      where: {
        userId: session.user.id,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ data: watchlistItems })
  } catch (error) {
    logger.error("Error fetching watchlist", error, {
      endpoint: "/api/watchlist",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const validatedData = watchlistSchema.parse(body)

    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId },
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    // Create or update watchlist item
    const watchlistItem = await prisma.applicationsWatchlist.upsert({
      where: {
        userId_programId: {
          userId: session.user.id,
          programId: validatedData.programId,
        },
      },
      update: {
        priority: validatedData.priority,
        notes: validatedData.notes,
      },
      create: {
        userId: session.user.id,
        programId: validatedData.programId,
        priority: validatedData.priority || "medium",
        notes: validatedData.notes || null,
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

    return NextResponse.json(
      {
        message: "Program added to watchlist",
        data: watchlistItem,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error adding to watchlist", error, {
      endpoint: "/api/watchlist",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


