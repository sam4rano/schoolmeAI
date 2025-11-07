import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/middleware/admin"
import { checkDeadlineReminders, checkNewPrograms } from "@/lib/utils/notification-service"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function POST(request: NextRequest) {
  try {
    // Only admins can trigger notification checks
    await requireAdmin()

    const { deadlineReminders, newPrograms } = await request.json().catch(() => ({}))

    const results: any = {}

    if (deadlineReminders !== false) {
      results.deadlineReminders = await checkDeadlineReminders()
    }

    if (newPrograms !== false) {
      results.newPrograms = await checkNewPrograms()
    }

    return NextResponse.json({
      message: "Notification checks completed",
      results,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

