import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { handleApiError } from "@/lib/utils/api-error-handler"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    // Get total counts
    const [totalPrograms, totalInstitutions] = await Promise.all([
      prisma.program.count(),
      prisma.institution.count(),
    ])

    // Get programs with cutoff data
    const programsWithCutoff = await prisma.program.findMany({
      where: {
        cutoffHistory: {
          not: null as any,
        },
      },
      select: {
        id: true,
        cutoffHistory: true,
      },
    })

    // Count programs with valid cutoff history
    const programsWithValidCutoff = programsWithCutoff.filter((program) => {
      if (!program.cutoffHistory) return false
      const cutoffHistory = Array.isArray(program.cutoffHistory)
        ? program.cutoffHistory
        : JSON.parse(JSON.stringify(program.cutoffHistory))
      return cutoffHistory.length > 0 && cutoffHistory.some((c: any) => c.cutoff && c.year)
    }).length

    // Get institutions with fee data
    const institutionsWithFees = await prisma.institution.count({
      where: {
        OR: [
          { tuitionFees: { not: null as any } },
          { feesSchedule: { not: null as any } },
        ],
      },
    })

    // Get programs with fee data
    const programsWithFees = await prisma.program.count({
      where: {
        tuitionFees: {
          not: null as any,
        },
      },
    })

    // Get programs with descriptions
    const programsWithDescription = await prisma.program.count({
      where: {
        AND: [
          { description: { not: null as any } },
          { description: { not: "" } },
        ],
      },
    })

    // Calculate coverage percentages
    const cutoffCoverage = totalPrograms > 0
      ? Math.round((programsWithValidCutoff / totalPrograms) * 100)
      : 0
    
    const feeCoverage = totalInstitutions > 0 || totalPrograms > 0
      ? Math.round(((institutionsWithFees + programsWithFees) / (totalInstitutions + totalPrograms)) * 100)
      : 0
    
    const descriptionCoverage = totalPrograms > 0
      ? Math.round((programsWithDescription / totalPrograms) * 100)
      : 0

    return NextResponse.json({
      data: {
        cutoff: {
          total: totalPrograms,
          withData: programsWithValidCutoff,
          withoutData: totalPrograms - programsWithValidCutoff,
          coverage: cutoffCoverage,
          percentage: `${cutoffCoverage}%`,
        },
        fees: {
          total: totalInstitutions + totalPrograms,
          withData: institutionsWithFees + programsWithFees,
          withoutData: (totalInstitutions + totalPrograms) - (institutionsWithFees + programsWithFees),
          coverage: feeCoverage,
          percentage: `${feeCoverage}%`,
        },
        descriptions: {
          total: totalPrograms,
          withData: programsWithDescription,
          withoutData: totalPrograms - programsWithDescription,
          coverage: descriptionCoverage,
          percentage: `${descriptionCoverage}%`,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

