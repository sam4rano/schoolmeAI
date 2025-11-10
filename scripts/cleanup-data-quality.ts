import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Cleanup script to fix data quality issues:
 * 1. Remove invalid institutions (headers, page numbers, etc.)
 * 2. Fix duplicate institutions (keep best one)
 * 3. Add missing accreditation for University of Lagos programs
 * 4. Clean up invalid names
 */

function isValidInstitutionName(name: string): boolean {
  const invalidPatterns = [
    /^page \d+ of \d+$/i,
    /^list of/i,
    /^established by/i,
    /^nigeria and their/i,
    /^\d+\.?\s*$/,
    /^cardiac|cardio|thoracic nursing programme$/i,
    /^admission form/i,
    /^gets nbte accreditation/i,
  ]

  return !invalidPatterns.some((pattern) => pattern.test(name.trim()))
}

async function cleanupDataQuality() {
  try {
    console.log("Starting data quality cleanup...\n")

    // Step 1: Remove invalid institutions (headers, page numbers, etc.)
    console.log("Step 1: Removing invalid institutions...")
    const allInstitutions = await prisma.institution.findMany({
      select: { id: true, name: true, type: true },
    })

    const invalidInstitutions = allInstitutions.filter(
      (inst) => !isValidInstitutionName(inst.name)
    )

    console.log(`Found ${invalidInstitutions.length} invalid institutions`)

    let deleted = 0
    for (const invalid of invalidInstitutions) {
      try {
        await prisma.institution.delete({
          where: { id: invalid.id },
        })
        deleted++
        console.log(`  ✅ Deleted: ${invalid.name} (${invalid.type})`)
      } catch (error) {
        console.log(`  ⚠️  Error deleting ${invalid.name}: ${error}`)
      }
    }

    console.log(`Deleted ${deleted} invalid institutions\n`)

    // Step 2: Fix duplicate institutions (keep the one with most complete data)
    console.log("Step 2: Fixing duplicate institutions...")
    const duplicates = await prisma.$queryRaw<
      Array<{ name: string; type: string; state: string; count: bigint }>
    >`
      SELECT name, type, state, COUNT(*) as count
      FROM institutions
      GROUP BY name, type, state
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `

    console.log(`Found ${duplicates.length} duplicate groups`)

    let duplicatesRemoved = 0
    for (const dup of duplicates) {
      const institutions = await prisma.institution.findMany({
        where: {
          name: dup.name,
          type: dup.type as any,
          state: dup.state,
        },
        orderBy: [
          { website: "desc" },
          { city: "desc" },
          { accreditationStatus: "desc" },
        ],
      })

      // Keep the first one (most complete), delete the rest
      for (let i = 1; i < institutions.length; i++) {
        try {
          await prisma.institution.delete({
            where: { id: institutions[i].id },
          })
          duplicatesRemoved++
        } catch (error) {
          console.log(`  ⚠️  Error deleting duplicate ${institutions[i].name}: ${error}`)
        }
      }
    }

    console.log(`Removed ${duplicatesRemoved} duplicate institutions\n`)

    // Step 3: Add missing accreditation for University of Lagos programs
    console.log("Step 3: Adding missing accreditation for University of Lagos...")
    const unilag = await prisma.institution.findFirst({
      where: {
        name: {
          contains: "University of Lagos",
          mode: "insensitive",
        },
        type: "university",
      },
    })

    if (unilag) {
      const programsWithoutAccreditation = await prisma.program.findMany({
        where: {
          institutionId: unilag.id,
          accreditationStatus: null,
        },
      })

      console.log(`Found ${programsWithoutAccreditation.length} programs without accreditation`)

      // Set default accreditation status (Full) for University of Lagos programs
      for (const program of programsWithoutAccreditation) {
        await prisma.program.update({
          where: { id: program.id },
          data: {
            accreditationStatus: "Full",
            accreditationMaturityDate: 2028, // Default 5 years
            accreditationLastUpdated: new Date(),
          },
        })
      }

      console.log(`Updated ${programsWithoutAccreditation.length} programs with accreditation\n`)
    }

    // Step 4: Summary
    console.log("✅ Cleanup completed!\n")

    const finalInstitutions = await prisma.institution.count()
    const finalPrograms = await prisma.program.count()
    const finalAccredited = await prisma.institution.count({
      where: { accreditationStatus: "accredited" },
    })
    const finalProgramsAccredited = await prisma.program.count({
      where: { accreditationStatus: { not: null } },
    })

    console.log("Final Statistics:")
    console.log(`  Institutions: ${finalInstitutions}`)
    console.log(`  Accredited Institutions: ${finalAccredited}`)
    console.log(`  Programs: ${finalPrograms}`)
    console.log(`  Accredited Programs: ${finalProgramsAccredited}`)
  } catch (error) {
    console.error("Error during cleanup:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDataQuality()

