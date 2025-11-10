import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"
import { logAuditEvent } from "@/lib/utils/audit-logger"

const settingsSchema = z.object({
  // Data Quality Settings
  autoCalculateQualityScore: z.boolean().optional(),
  qualityScoreThreshold: z.number().min(0).max(100).optional(),
  // Audit Settings
  enableAuditLogging: z.boolean().optional(),
  auditLogRetentionDays: z.number().min(30).max(3650).optional(),
  // API Settings
  enablePublicAPI: z.boolean().optional(),
  apiRateLimit: z.number().min(10).max(10000).optional(),
  // Notification Settings
  notifyOnDataQualityIssues: z.boolean().optional(),
  notifyOnBulkOperations: z.boolean().optional(),
})

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()

    // Get or create default settings
    let settings = await prisma.settings.findUnique({
      where: { id: "system" },
    })

    // If settings don't exist, create with defaults
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "system",
        },
      })
    }

    return NextResponse.json({
      data: settings,
    })
  } catch (error) {
    logger.error("Error fetching settings", error, {
      endpoint: "/api/admin/settings",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

/**
 * @swagger
 * /api/admin/settings:
 *   post:
 *     summary: Update system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoCalculateQualityScore:
 *                 type: boolean
 *               qualityScoreThreshold:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               enableAuditLogging:
 *                 type: boolean
 *               auditLogRetentionDays:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 3650
 *               enablePublicAPI:
 *                 type: boolean
 *               apiRateLimit:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 10000
 *               notifyOnDataQualityIssues:
 *                 type: boolean
 *               notifyOnBulkOperations:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    // Get current settings
    let settings = await prisma.settings.findUnique({
      where: { id: "system" },
    })

    // If settings don't exist, create with defaults
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "system",
        },
      })
    }

    // Update settings (only update provided fields)
    const updatedSettings = await prisma.settings.update({
      where: { id: "system" },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
    })

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "settings",
      entityId: "system",
      action: "update",
      metadata: {
        changes: validatedData,
      },
    })

    return NextResponse.json({
      data: updatedSettings,
      message: "Settings updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error updating settings", error, {
      endpoint: "/api/admin/settings",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

