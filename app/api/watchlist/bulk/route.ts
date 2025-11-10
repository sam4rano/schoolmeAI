import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/middleware/auth"

const bulkAddSchema = z.object({
  programIds: z.array(z.string().uuid()).min(1).max(50),
  priority: z.enum(["high", "medium", "low"]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const validatedData = bulkAddSchema.parse(body)

    // Verify all programs exist
    const programs = await prisma.program.findMany({
      where: {
        id: { in: validatedData.programIds },
      },
    })

    if (programs.length !== validatedData.programIds.length) {
      return NextResponse.json(
        { error: "One or more programs not found" },
        { status: 404 }
      )
    }

    // Create watchlist items (using upsert to avoid duplicates)
    const watchlistItems = await Promise.all(
      validatedData.programIds.map((programId) =>
        prisma.applicationsWatchlist.upsert({
          where: {
            userId_programId: {
              userId: session.user.id,
              programId,
            },
          },
          update: {
            priority: validatedData.priority,
          },
          create: {
            userId: session.user.id,
            programId,
            priority: validatedData.priority || "medium",
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
      )
    )

    return NextResponse.json({
      message: `Added ${watchlistItems.length} program(s) to watchlist`,
      data: watchlistItems,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error bulk adding to watchlist", error, {
      endpoint: "/api/watchlist/bulk",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

