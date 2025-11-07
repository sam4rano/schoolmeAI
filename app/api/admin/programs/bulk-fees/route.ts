import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { z } from "zod"

const bulkFeesSchema = z.object({
  data: z.object({
    programs: z.array(z.object({
      id: z.string().uuid(),
      tuitionFees: z.any().optional(),
    })).optional(),
    institutions: z.array(z.object({
      id: z.string().uuid(),
      tuitionFees: z.any().optional(),
      feesSchedule: z.any().optional(),
    })).optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { data } = bulkFeesSchema.parse(body)

    let updated = 0
    const errors: string[] = []

    // Update programs
    if (data.programs && Array.isArray(data.programs)) {
      for (const item of data.programs) {
        try {
          const program = await prisma.program.findUnique({
            where: { id: item.id },
          })

          if (!program) {
            errors.push(`Program ${item.id} not found`)
            continue
          }

          await prisma.program.update({
            where: { id: item.id },
            data: {
              tuitionFees: item.tuitionFees || null,
            },
          })

          updated++
        } catch (error) {
          errors.push(`Error updating program ${item.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    }

    // Update institutions
    if (data.institutions && Array.isArray(data.institutions)) {
      for (const item of data.institutions) {
        try {
          const institution = await prisma.institution.findUnique({
            where: { id: item.id },
          })

          if (!institution) {
            errors.push(`Institution ${item.id} not found`)
            continue
          }

          await prisma.institution.update({
            where: { id: item.id },
            data: {
              tuitionFees: item.tuitionFees || item.feesSchedule || null,
              feesSchedule: item.feesSchedule || item.tuitionFees || null,
            },
          })

          updated++
        } catch (error) {
          errors.push(`Error updating institution ${item.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "program",
      entityId: "bulk",
      action: "update",
      metadata: {
        type: "bulk_fees_import",
        updated,
        errors: errors.length,
      },
    })

    return NextResponse.json({
      success: true,
      updated,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

