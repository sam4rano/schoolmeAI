import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/middleware/auth"

const watchlistSchema = z.object({
  institutionId: z.string().uuid(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const watchlistItems = await (prisma as any).institutionWatchlist.findMany({
      where: {
        userId: session.user.id,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ data: watchlistItems })
  } catch (error) {
    logger.error("Error fetching institution watchlist", error, {
      endpoint: "/api/watchlist/institutions",
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

    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: validatedData.institutionId },
    })

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      )
    }

    // Create or update watchlist item
    const watchlistItem = await (prisma as any).institutionWatchlist.upsert({
      where: {
        userId_institutionId: {
          userId: session.user.id,
          institutionId: validatedData.institutionId,
        },
      },
      update: {
        priority: validatedData.priority,
        notes: validatedData.notes,
      },
      create: {
        userId: session.user.id,
        institutionId: validatedData.institutionId,
        priority: validatedData.priority || "medium",
        notes: validatedData.notes || null,
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

    return NextResponse.json(
      {
        message: "Institution added to watchlist",
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

    logger.error("Error adding institution to watchlist", error, {
      endpoint: "/api/watchlist/institutions",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

