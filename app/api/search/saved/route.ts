import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware/auth"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"

const savedSearchSchema = z.object({
  type: z.enum(["programs", "institutions"]),
  name: z.string().min(1).max(100),
  filters: z.record(z.any()),
})

/**
 * GET /api/search/saved - Get saved searches
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as "programs" | "institutions" | null

    // For now, we'll store saved searches in localStorage on the client side
    // In the future, we can add a SavedSearch model to the database
    // For now, return empty array as saved searches are client-side only
    return NextResponse.json({
      data: [],
    })
  } catch (error) {
    logger.error("Error fetching saved searches", error, {
      endpoint: "/api/search/saved",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * POST /api/search/saved - Save a search
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const validatedData = savedSearchSchema.parse(body)

    // For now, saved searches are stored client-side in localStorage
    // In the future, we can add a SavedSearch model to the database
    return NextResponse.json({
      message: "Search saved (client-side only for now)",
      data: {
        id: Date.now().toString(),
        ...validatedData,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error saving search", error, {
      endpoint: "/api/search/saved",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * DELETE /api/search/saved/[id] - Delete a saved search
 */
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

    // For now, saved searches are stored client-side in localStorage
    return NextResponse.json({
      message: "Search deleted (client-side only for now)",
    })
  } catch (error) {
    logger.error("Error deleting saved search", error, {
      endpoint: "/api/search/saved/[id]",
      method: "DELETE",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

