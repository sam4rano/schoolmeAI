import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Propagate institution-level accreditation to programs
 * For COE (NCCE) and Polytechnics (NBTE), accreditation is at institution level
 * This script propagates institution accreditation status to all programs
 */
async function propagateInstitutionAccreditation() {
  try {
    console.log("Propagating institution-level accreditation to programs...\n")

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

    console.log(`Found ${institutions.length} institutions with accreditation status`)

    const results = {
      institutions: 0,
      programsUpdated: 0,
      programsCreated: 0,
      errors: [] as string[],
    }

    const currentYear = new Date().getFullYear()
    const updateDate = new Date()

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
          },
        })

        if (programs.length === 0) {
          // No programs yet - skip
          continue
        }

        // Determine accreditation status
        // For COE and polytechnics, if institution is accredited, programs are accredited
        let programAccreditationStatus: string | null = null
        let accreditationMaturityDate: number | null = null

        if (institution.accreditationStatus === "accredited") {
          // Institution is accredited - set programs to "Full" accreditation
          // For COE/polytechnics, we don't have maturity dates, so set to current year + 5
          programAccreditationStatus = "Full"
          accreditationMaturityDate = currentYear + 5 // Default 5 years
        } else if (institution.accreditationStatus === "not_accredited") {
          programAccreditationStatus = "Denied"
        }

        // Update all programs for this institution
        for (const program of programs) {
          try {
            // Only update if program doesn't have accreditation status
            // For COE and polytechnics, we want to propagate institution-level accreditation
            if (!program.accreditationStatus && programAccreditationStatus) {
              const existingProvenance = (program as any).provenance || {}
              await prisma.program.update({
                where: { id: program.id },
                data: {
                  accreditationStatus: programAccreditationStatus,
                  accreditationMaturityDate: accreditationMaturityDate,
                  accreditationLastUpdated: updateDate,
                  isActive: programAccreditationStatus !== "Denied",
                  lastVerifiedAt: updateDate,
                  provenance: {
                    ...existingProvenance,
                    accreditation_source: institution.type === "college" ? "NCCE" : "NBTE",
                    institution_accreditation: institution.accreditationStatus,
                    propagated_at: updateDate.toISOString(),
                  },
                } as any, // Type assertion to work around Prisma type issues
              })
              results.programsUpdated++
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error"
            results.errors.push(`${institution.name} - ${program.name}: ${errorMsg}`)
            if (results.errors.length <= 10) {
              console.error(`Error updating ${institution.name} - ${program.name}:`, errorMsg)
            }
          }
        }

        results.institutions++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${institution.name}: ${errorMsg}`)
      }
    }

    console.log("\n✅ Propagation completed!")
    console.log(`\nResults:`)
    console.log(`  Institutions processed: ${results.institutions}`)
    console.log(`  Programs updated: ${results.programsUpdated}`)
    console.log(`  Programs created: ${results.programsCreated}`)
    console.log(`  Errors: ${results.errors.length}`)

    if (results.errors.length > 0 && results.errors.length <= 20) {
      console.log(`\nErrors:`)
      results.errors.forEach((error) => {
        console.log(`  - ${error}`)
      })
    }

    // Show summary by type
    const byType = await prisma.program.groupBy({
      by: ["accreditationStatus"],
      where: {
        institution: {
          OR: [{ type: "college" }, { type: "polytechnic" }],
        },
      },
      _count: true,
    })

    console.log(`\nPrograms with accreditation by type:`)
    byType.forEach((item) => {
      console.log(`  ${item.accreditationStatus || "None"}: ${item._count}`)
    })
  } catch (error) {
    console.error("Error propagating accreditation:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

propagateInstitutionAccreditation()

