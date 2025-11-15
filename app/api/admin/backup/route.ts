/**
 * Admin API for database backups
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/middleware/admin"
import { createBackup, listBackups, restoreBackup, cleanupOldBackups } from "@/lib/backup/backup-service"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { logAuditEvent } from "@/lib/utils/audit-logger"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    
    if (action === "list") {
      const backups = await listBackups()
      return NextResponse.json({ data: backups })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    
    const body = await request.json()
    const { action, filePath, keepCount } = body
    
    if (action === "create") {
      const result = await createBackup({
        format: body.format || "sql",
        compress: body.compress !== false,
      })
      
      if (result.success) {
        await logAuditEvent({
          userId: session.user.id,
          action: "create",
          entityType: "backup",
          entityId: "backup",
          metadata: {
            filePath: result.filePath,
            size: result.size,
          },
        })
      }
      
      return NextResponse.json({ data: result })
    } else if (action === "restore") {
      if (!filePath) {
        return NextResponse.json({ error: "filePath is required" }, { status: 400 })
      }
      
      const result = await restoreBackup(filePath)
      
      if (result.success) {
        await logAuditEvent({
          userId: session.user.id,
          action: "restore",
          entityType: "backup",
          entityId: "backup",
          metadata: {
            filePath,
          },
        })
      }
      
      return NextResponse.json({ data: result })
    } else if (action === "cleanup") {
      const deleted = await cleanupOldBackups(keepCount || 10)
      return NextResponse.json({ data: { deleted } })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

