import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware/auth"
import { getUserSessions, deleteSession, deleteAllUserSessions } from "@/lib/utils/sessions"

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const sessions = await getUserSessions(session.user.id) as any[]

    return NextResponse.json({
      data: sessions.map((s: any) => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        expires: s.expires,
      })),
    })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const all = searchParams.get("all") === "true"

    if (all) {
      await deleteAllUserSessions(session.user.id)
      return NextResponse.json({
        message: "All sessions signed out successfully",
      })
    }

    if (sessionId) {
      const targetSession = await getUserSessions(session.user.id)
      const sessionToDelete = targetSession.find((s) => s.id === sessionId)

      if (!sessionToDelete) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        )
      }

      await deleteSession(sessionToDelete.sessionToken)
      return NextResponse.json({
        message: "Session signed out successfully",
      })
    }

    return NextResponse.json(
      { error: "sessionId or all parameter required" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    )
  }
}

