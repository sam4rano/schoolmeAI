/**
 * Admin API for managing scheduled tasks
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/middleware/admin"
import { cronScheduler } from "@/lib/cron/scheduler"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const tasks = cronScheduler.getTasks()
    
    return NextResponse.json({
      data: tasks.map((task) => ({
        id: task.id,
        name: task.name,
        schedule: task.schedule,
        enabled: task.enabled,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { action, taskId } = body
    
    if (action === "enable") {
      cronScheduler.enable(taskId)
      return NextResponse.json({ message: "Task enabled" })
    } else if (action === "disable") {
      cronScheduler.disable(taskId)
      return NextResponse.json({ message: "Task disabled" })
    } else if (action === "run") {
      const task = cronScheduler.getTask(taskId)
      if (task) {
        await task.handler()
        return NextResponse.json({ message: "Task executed successfully" })
      } else {
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
      }
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

