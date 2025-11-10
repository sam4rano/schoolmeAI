import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { logger } from "@/lib/utils/logger"

/**
 * Propagate institution-level accreditation to programs
 * For COE (NCCE) and Polytechnics (NBTE), accreditation is at institution level
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()

    const currentYear = new Date().getFullYear()
    const updateDate = new Date()

    // Get all institutions with accreditation status
    const institutions = await prisma.institution.findMany({
      where: {
        accreditationStatus: {
          not: null,
        },
        OR: [
          { type: "college" }, // NCCE accredited
          { type: "polytechnic" }, // NBTE accredited
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        accreditationStatus: true,
        provenance: true,
        lastVerifiedAt: true,
      },
    })

    const results = {
      institutions: 0,
      programsUpdated: 0,
      errors: [] as string[],
    }

    for (const institution of institutions) {
      try {
        // Get all programs for this institution
        const programs = await prisma.program.findMany({
          where: {
            institutionId: institution.id,
          },
          select: {
            id: true,
            name: true,
            accreditationStatus: true,
            provenance: true,
          },
        })

        if (programs.length === 0) {
          continue
        }

        // Determine accreditation status
        let programAccreditationStatus: string | null = null
        let accreditationMaturityDate: number | null = null

        if (institution.accreditationStatus === "accredited") {
          programAccreditationStatus = "Full"
          accreditationMaturityDate = currentYear + 5 // Default 5 years for institution-level
        } else if (institution.accreditationStatus === "not_accredited") {
          programAccreditationStatus = "Denied"
        }

        // Update all programs for this institution
        for (const program of programs) {
          try {
            // Only update if program doesn't have accreditation status
            // or if it's different from institution status
            if (
              !program.accreditationStatus ||
              program.accreditationStatus !== programAccreditationStatus
            ) {
              await prisma.program.update({
                where: { id: program.id },
                data: {
                  accreditationStatus: programAccreditationStatus,
                  accreditationMaturityDate: accreditationMaturityDate,
                  accreditationLastUpdated: updateDate,
                  isActive: programAccreditationStatus !== "Denied",
                  lastVerifiedAt: updateDate,
                  provenance: {
                    ...(program.provenance as any),
                    accreditation_source: institution.type === "college" ? "NCCE" : "NBTE",
                    institution_accreditation: institution.accreditationStatus,
                    propagated_at: updateDate.toISOString(),
                  },
                },
              })
              results.programsUpdated++
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error"
            results.errors.push(`${institution.name} - ${program.name}: ${errorMsg}`)
            logger.error(`Error updating program ${program.name}`, error, {
              institution: institution.name,
              program: program.name,
            })
          }
        }

        results.institutions++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${institution.name}: ${errorMsg}`)
        logger.error(`Error processing institution ${institution.name}`, error, {
          institution: institution.name,
        })
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "program",
      entityId: "bulk-accreditation-propagation",
      action: "update",
      metadata: {
        institutions: results.institutions,
        programsUpdated: results.programsUpdated,
        errors: results.errors.length,
      },
    })

    return NextResponse.json({
      success: true,
      results,
      message: `Propagated accreditation from ${results.institutions} institutions to ${results.programsUpdated} programs`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

