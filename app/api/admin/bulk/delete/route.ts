import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"

const bulkDeleteSchema = z.object({
  entityType: z.enum(["institution", "program"]),
  ids: z.array(z.string().uuid()).min(1),
  confirm: z.boolean().optional(), // Safety confirmation
})

/**
 * @swagger
 * /api/admin/bulk/delete:
 *   post:
 *     summary: Bulk delete institutions or programs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - ids
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [institution, program]
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               confirm:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bulk delete completed
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
    const { entityType, ids, confirm } = bulkDeleteSchema.parse(body)

    // Safety check - require explicit confirmation for bulk delete
    if (confirm !== true) {
      return NextResponse.json(
        { error: "Bulk delete requires explicit confirmation. Set 'confirm' to true." },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array must not be empty" },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Limit bulk delete to prevent accidental mass deletion
    const MAX_BULK_DELETE = 100
    if (ids.length > MAX_BULK_DELETE) {
      return NextResponse.json(
        { error: `Cannot delete more than ${MAX_BULK_DELETE} items at once. Please delete in smaller batches.` },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    let deleted = 0
    let failed = 0
    const errors: Array<{ id: string; error: string }> = []
    const deletedIds: string[] = []

    if (entityType === "institution") {
      // First, check which institutions exist and get their names for logging
      const institutions = await prisma.institution.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })

      const existingIds = new Set(institutions.map(i => i.id))
      const missingIds = ids.filter(id => !existingIds.has(id))

      // Log missing IDs as errors
      for (const id of missingIds) {
        errors.push({ id, error: "Institution not found" })
        failed++
      }

      // Delete existing institutions
      // Note: Programs will be cascade deleted due to onDelete: Cascade
      for (const institution of institutions) {
        try {
          await prisma.institution.delete({
            where: { id: institution.id },
          })
          deletedIds.push(institution.id)
          deleted++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          errors.push({ id: institution.id, error: errorMessage })
          failed++
        }
      }
    } else if (entityType === "program") {
      // First, check which programs exist
      const programs = await prisma.program.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })

      const existingIds = new Set(programs.map(p => p.id))
      const missingIds = ids.filter(id => !existingIds.has(id))

      // Log missing IDs as errors
      for (const id of missingIds) {
        errors.push({ id, error: "Program not found" })
        failed++
      }

      // Delete existing programs
      for (const program of programs) {
        try {
          await prisma.program.delete({
            where: { id: program.id },
          })
          deletedIds.push(program.id)
          deleted++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          errors.push({ id: program.id, error: errorMessage })
          failed++
        }
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: entityType as "institution" | "program",
      entityId: "bulk",
      action: "delete",
      metadata: {
        count: deleted,
        failed,
        deletedIds: deletedIds.slice(0, 10), // Log first 10 IDs
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Log first 10 errors
      },
    })

    logger.info("Bulk delete completed", {
      entityType,
      deleted,
      failed,
      total: ids.length,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        deleted,
        failed,
        total: ids.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error in bulk delete", error, {
      endpoint: "/api/admin/bulk/delete",
      method: "POST",
    })
    return handleApiError(error)
  }
}

