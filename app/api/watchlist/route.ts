import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const watchlistSchema = z.object({
  programId: z.string().uuid(),
  priority: z.enum(["high", "medium", "low"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

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
    console.error("Error fetching watchlist:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

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
      },
      create: {
        userId: session.user.id,
        programId: validatedData.programId,
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

    console.error("Error adding to watchlist:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


