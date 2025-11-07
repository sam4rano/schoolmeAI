import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"

const bulkCutoffSchema = z.object({
  updates: z.array(
    z.object({
      programId: z.string().uuid(),
      cutoffHistory: z.array(
        z.object({
          year: z.number().int().min(2000).max(2030),
          cutoff: z.number().min(0).max(400),
          admissionMode: z.enum(["UTME", "POST_UTME", "DIRECT_ENTRY"]).optional(),
          sourceUrl: z.string().url().optional().or(z.literal("")),
          confidence: z.enum(["verified", "estimated", "unverified"]).optional(),
        })
      ),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const data = bulkCutoffSchema.parse(body)

    const results = []
    const errors = []

    for (const update of data.updates) {
      try {
        // Get existing program
        const program = await prisma.program.findUnique({
          where: { id: update.programId },
        })

        if (!program) {
          errors.push({
            programId: update.programId,
            error: "Program not found",
          })
          continue
        }

        // Merge with existing cutoff history
        const existingHistory = Array.isArray(program.cutoffHistory)
          ? (program.cutoffHistory as any[])
          : []

        // Create a map of existing entries by year
        const existingMap = new Map(
          existingHistory.map((entry: any) => [entry.year, entry])
        )

        // Merge new entries (new entries override existing ones for the same year)
        const mergedHistory = [...existingHistory]
        for (const newEntry of update.cutoffHistory) {
          const existingIndex = mergedHistory.findIndex(
            (e: any) => e.year === newEntry.year
          )
          if (existingIndex >= 0) {
            mergedHistory[existingIndex] = {
              ...mergedHistory[existingIndex],
              ...newEntry,
            }
          } else {
            mergedHistory.push({
              ...newEntry,
              admissionMode: newEntry.admissionMode || "UTME",
              confidence: newEntry.confidence || "unverified",
            })
          }
        }

        // Sort by year descending
        mergedHistory.sort((a: any, b: any) => b.year - a.year)

        // Update program
        await prisma.program.update({
          where: { id: update.programId },
          data: {
            cutoffHistory: mergedHistory,
            lastVerifiedAt: new Date(),
          },
        })

        // Log audit event
        await logAuditEvent({
          userId: session.user.id,
          entityType: "program",
          entityId: update.programId,
          action: "update",
          metadata: {
            bulkUpdate: true,
            cutoffEntriesAdded: update.cutoffHistory.length,
          },
        })

        results.push({
          programId: update.programId,
          success: true,
          cutoffEntriesAdded: update.cutoffHistory.length,
        })
      } catch (error) {
        errors.push({
          programId: update.programId,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      data: {
        success: results.length,
        errorCount: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

