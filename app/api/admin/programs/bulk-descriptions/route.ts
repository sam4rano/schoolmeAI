import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { z } from "zod"

const bulkDescriptionsSchema = z.object({
  data: z.object({
    programs: z.array(z.object({
      id: z.string().uuid(),
      description: z.string().min(10),
    })),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { data } = bulkDescriptionsSchema.parse(body)

    let updated = 0
    const errors: string[] = []

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
            description: item.description,
          },
        })

        updated++
      } catch (error) {
        errors.push(`Error updating program ${item.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "program",
      entityId: "bulk",
      action: "update",
      metadata: {
        type: "bulk_descriptions_import",
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

