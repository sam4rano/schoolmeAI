import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  convertGradesToPoints,
  calculateCompositeScore,
} from "@/lib/eligibility"
import { estimateProbabilityWithModel } from "@/lib/probability-model"
import { logger } from "@/lib/utils/logger"
import { getCached, generateCacheKey, CACHE_CONFIG, CACHE_TAGS } from "@/lib/cache"

const recommendationsSchema = z.object({
  utme: z.number().min(0).max(400),
  olevels: z.record(z.string(), z.string()),
  stateOfOrigin: z.string().optional(),
  postUtme: z.number().optional(),
  limit: z.number().optional().default(10),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = recommendationsSchema.parse(body)

    // Convert O-level grades to points
    const olevelPoints = convertGradesToPoints(validatedData.olevels)

    // Normalize UTME score (0-400) to 0-100 scale
    const utmeNormalized = (validatedData.utme / 400) * 100

    // Calculate composite score
    const compositeScore = calculateCompositeScore(
      utmeNormalized,
      olevelPoints,
      validatedData.postUtme
    )

    // Generate cache key based on user inputs (recommendations are user-specific)
    const cacheKey = generateCacheKey("recommendations", {
      utme: validatedData.utme,
      olevels: validatedData.olevels,
      stateOfOrigin: validatedData.stateOfOrigin || "",
      postUtme: validatedData.postUtme || 0,
      limit: validatedData.limit,
    })

    // Fetch programs with cutoff history (cached)
    // Filter out denied programs and prioritize fully accredited programs
    // For COE and polytechnics, use institution-level accreditation if program-level is not available
    const programs = await getCached(
      cacheKey,
      async () => {
        return prisma.program.findMany({
          where: {
            isActive: true, // Only active programs
            OR: [
              { accreditationStatus: null }, // Programs without accreditation data
              { accreditationStatus: { not: "Denied" } }, // Not denied
            ],
          },
          include: {
            institution: {
              select: {
                id: true,
                name: true,
                type: true,
                ownership: true,
                state: true,
                accreditationStatus: true, // Include institution accreditation for fallback
              },
            },
          },
          take: 200, // Fetch more to filter and rank
        })
      },
      CACHE_CONFIG.RECOMMENDATIONS_TTL,
      [CACHE_TAGS.RECOMMENDATIONS]
    )

    // Calculate eligibility for each program
    const currentYear = new Date().getFullYear()
    const programsWithEligibility = programs
      .map((program) => {
        const cutoffHistory = program.cutoffHistory
          ? Array.isArray(program.cutoffHistory)
            ? program.cutoffHistory
            : JSON.parse(JSON.stringify(program.cutoffHistory))
          : []

        const probabilityData = estimateProbabilityWithModel(
          compositeScore,
          cutoffHistory
        )

        // Calculate accreditation score for ranking
        // Use program-level accreditation if available, otherwise fall back to institution-level
        let accreditationStatus = program.accreditationStatus
        let accreditationSource = "program"

        // For COE and polytechnics, use institution-level accreditation if program-level is not available
        if (
          !accreditationStatus &&
          (program.institution.type === "college" || program.institution.type === "polytechnic")
        ) {
          if (program.institution.accreditationStatus === "accredited") {
            accreditationStatus = "Full"
            accreditationSource = "institution"
          } else if (program.institution.accreditationStatus === "not_accredited") {
            accreditationStatus = "Denied"
            accreditationSource = "institution"
          }
        }

        let accreditationScore = 0
        let accreditationWarning: string | null = null

        if (accreditationStatus === "Full") {
          accreditationScore = 10 // Highest priority
        } else if (accreditationStatus === "Interim") {
          accreditationScore = 5
          accreditationWarning = "Interim accreditation"
        } else if (accreditationStatus === "Denied") {
          accreditationScore = -100 // Should be filtered out
        }

        // Check if accreditation is expiring soon
        if (program.accreditationMaturityDate) {
          const yearsUntilExpiry = program.accreditationMaturityDate - currentYear
          if (yearsUntilExpiry <= 2 && yearsUntilExpiry > 0) {
            accreditationWarning = `Accreditation expires in ${yearsUntilExpiry} year${yearsUntilExpiry > 1 ? "s" : ""}`
            accreditationScore -= 2
          } else if (yearsUntilExpiry <= 0) {
            accreditationWarning = "Accreditation expired"
            accreditationScore -= 5
          }
        }

        // Add source indicator for institution-level accreditation
        if (accreditationSource === "institution") {
          const sourceBody =
            program.institution.type === "college" ? "NCCE" : "NBTE"
          if (!accreditationWarning) {
            accreditationWarning = `Institution-level accreditation (${sourceBody})`
          }
        }

        return {
          ...program,
          eligibility: {
            probability: probabilityData.probability,
            category: probabilityData.category,
            compositeScore,
            confidenceInterval: probabilityData.confidenceInterval,
            accreditationScore,
            accreditationWarning,
          },
        }
      })
      .filter((p) => {
        // Filter out very low probability
        if (p.eligibility.probability < 0.3) return false
        // Filter out denied programs (check both program and institution level)
        const status = p.accreditationStatus || 
          (p.institution.accreditationStatus === "not_accredited" ? "Denied" : null)
        if (status === "Denied") return false
        return true
      })
      .sort((a, b) => {
        // Sort by accreditation score first (prioritize fully accredited)
        if (b.eligibility.accreditationScore !== a.eligibility.accreditationScore) {
          return b.eligibility.accreditationScore - a.eligibility.accreditationScore
        }
        // Then by probability (descending)
        if (b.eligibility.probability !== a.eligibility.probability) {
          return b.eligibility.probability - a.eligibility.probability
        }
        // Then by category
        const categoryOrder = { safe: 3, target: 2, reach: 1 }
        return (
          categoryOrder[b.eligibility.category] -
          categoryOrder[a.eligibility.category]
        )
      })
      .slice(0, validatedData.limit)

    return NextResponse.json({
      data: programsWithEligibility,
      meta: {
        compositeScore,
        totalPrograms: programs.length,
        recommended: programsWithEligibility.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error generating recommendations", error, {
      endpoint: "/api/recommendations",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

