import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"

const bulkUpdateSchema = z.object({
  entityType: z.enum(["institution", "program"]),
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      data: z.record(z.any()), // Flexible update data
    })
  ),
})

const institutionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["university", "polytechnic", "college", "nursing", "military"]).optional(),
  ownership: z.enum(["federal", "state", "private"]).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contact: z.record(z.any()).optional(),
  accreditationStatus: z.string().optional(),
  dataQualityScore: z.number().min(0).max(100).optional(),
})

const programUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  institutionId: z.string().uuid().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  degreeType: z.string().optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  utmeSubjects: z.array(z.string()).optional(),
  olevelSubjects: z.array(z.string()).optional(),
  admissionRequirements: z.record(z.any()).optional(),
  cutoffHistory: z.array(z.any()).optional(),
  tuitionFees: z.any().optional(),
  careerProspects: z.array(z.string()).optional(),
  applicationDeadline: z.string().datetime().optional().or(z.literal("")),
  accreditationStatus: z.string().optional(),
  accreditationMaturityDate: z.number().optional(),
  isActive: z.boolean().optional(),
  dataQualityScore: z.number().min(0).max(100).optional(),
})

/**
 * @swagger
 * /api/admin/bulk/update:
 *   post:
 *     summary: Bulk update institutions or programs
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
 *               - updates
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [institution, program]
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - data
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     data:
 *                       type: object
 *     responses:
 *       200:
 *         description: Bulk update completed
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
    const { entityType, updates } = bulkUpdateSchema.parse(body)

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array must not be empty" },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    let updated = 0
    let failed = 0
    const errors: Array<{ id: string; error: string }> = []
    const updatedIds: string[] = []

    if (entityType === "institution") {
      for (const update of updates) {
        try {
          // Validate update data
          const validatedData = institutionUpdateSchema.parse(update.data)

          // Check if institution exists
          const existing = await prisma.institution.findUnique({
            where: { id: update.id },
          })

          if (!existing) {
            errors.push({ id: update.id, error: "Institution not found" })
            failed++
            continue
          }

          // Normalize website URL if provided
          let website = validatedData.website
          if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
            website = "https://" + website
          }

          // Prepare update data
          const updateData: any = {}
          if (validatedData.name !== undefined) updateData.name = validatedData.name
          if (validatedData.type !== undefined) updateData.type = validatedData.type
          if (validatedData.ownership !== undefined) updateData.ownership = validatedData.ownership
          if (validatedData.state !== undefined) updateData.state = validatedData.state
          if (validatedData.city !== undefined) updateData.city = validatedData.city
          if (validatedData.website !== undefined) updateData.website = website || null
          if (validatedData.contact !== undefined) updateData.contact = validatedData.contact
          if (validatedData.accreditationStatus !== undefined) updateData.accreditationStatus = validatedData.accreditationStatus
          if (validatedData.dataQualityScore !== undefined) updateData.dataQualityScore = validatedData.dataQualityScore

          await prisma.institution.update({
            where: { id: update.id },
            data: updateData,
          })

          updatedIds.push(update.id)
          updated++
        } catch (error) {
          const errorMessage = error instanceof z.ZodError
            ? `Validation error: ${error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`
            : error instanceof Error
            ? error.message
            : "Unknown error"
          errors.push({ id: update.id, error: errorMessage })
          failed++
        }
      }
    } else if (entityType === "program") {
      for (const update of updates) {
        try {
          // Validate update data
          const validatedData = programUpdateSchema.parse(update.data)

          // Check if program exists
          const existing = await prisma.program.findUnique({
            where: { id: update.id },
          })

          if (!existing) {
            errors.push({ id: update.id, error: "Program not found" })
            failed++
            continue
          }

          // Prepare update data
          const updateData: any = {}
          if (validatedData.name !== undefined) updateData.name = validatedData.name
          if (validatedData.institutionId !== undefined) updateData.institutionId = validatedData.institutionId
          if (validatedData.faculty !== undefined) updateData.faculty = validatedData.faculty
          if (validatedData.department !== undefined) updateData.department = validatedData.department
          if (validatedData.degreeType !== undefined) updateData.degreeType = validatedData.degreeType
          if (validatedData.description !== undefined) updateData.description = validatedData.description
          if (validatedData.duration !== undefined) updateData.duration = validatedData.duration
          if (validatedData.utmeSubjects !== undefined) updateData.utmeSubjects = validatedData.utmeSubjects
          if (validatedData.olevelSubjects !== undefined) updateData.olevelSubjects = validatedData.olevelSubjects
          if (validatedData.admissionRequirements !== undefined) updateData.admissionRequirements = validatedData.admissionRequirements
          if (validatedData.cutoffHistory !== undefined) updateData.cutoffHistory = validatedData.cutoffHistory
          if (validatedData.tuitionFees !== undefined) updateData.tuitionFees = validatedData.tuitionFees
          if (validatedData.careerProspects !== undefined) updateData.careerProspects = validatedData.careerProspects
          if (validatedData.applicationDeadline !== undefined) {
            updateData.applicationDeadline = validatedData.applicationDeadline
              ? new Date(validatedData.applicationDeadline)
              : null
          }
          if (validatedData.accreditationStatus !== undefined) updateData.accreditationStatus = validatedData.accreditationStatus
          if (validatedData.accreditationMaturityDate !== undefined) updateData.accreditationMaturityDate = validatedData.accreditationMaturityDate
          if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
          if (validatedData.dataQualityScore !== undefined) updateData.dataQualityScore = validatedData.dataQualityScore

          await prisma.program.update({
            where: { id: update.id },
            data: updateData,
          })

          updatedIds.push(update.id)
          updated++
        } catch (error) {
          const errorMessage = error instanceof z.ZodError
            ? `Validation error: ${error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`
            : error instanceof Error
            ? error.message
            : "Unknown error"
          errors.push({ id: update.id, error: errorMessage })
          failed++
        }
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: entityType as "institution" | "program",
      entityId: "bulk",
      action: "update",
      metadata: {
        count: updated,
        failed,
        updatedIds: updatedIds.slice(0, 10), // Log first 10 IDs
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Log first 10 errors
      },
    })

    logger.info("Bulk update completed", {
      entityType,
      updated,
      failed,
      total: updates.length,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        updated,
        failed,
        total: updates.length,
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

    logger.error("Error in bulk update", error, {
      endpoint: "/api/admin/bulk/update",
      method: "POST",
    })
    return handleApiError(error)
  }
}

