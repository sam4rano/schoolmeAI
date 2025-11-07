import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        status: "unread",
      },
      data: {
        status: "read",
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "All notifications marked as read",
      count: result.count,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

