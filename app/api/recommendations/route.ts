import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  convertGradesToPoints,
  calculateCompositeScore,
} from "@/lib/eligibility"
import { estimateProbabilityWithModel } from "@/lib/probability-model"

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

    // Fetch programs with cutoff history
    const programs = await prisma.program.findMany({
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            ownership: true,
            state: true,
          },
        },
      },
      take: 200, // Fetch more to filter and rank
    })

    // Calculate eligibility for each program
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

        return {
          ...program,
          eligibility: {
            probability: probabilityData.probability,
            category: probabilityData.category,
            compositeScore,
            confidenceInterval: probabilityData.confidenceInterval,
          },
        }
      })
      .filter((p) => p.eligibility.probability >= 0.3) // Filter out very low probability
      .sort((a, b) => {
        // Sort by probability (descending), then by category
        if (b.eligibility.probability !== a.eligibility.probability) {
          return b.eligibility.probability - a.eligibility.probability
        }
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

    console.error("Error generating recommendations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

