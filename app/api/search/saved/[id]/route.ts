import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"

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

