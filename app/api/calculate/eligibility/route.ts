import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  convertGradesToPoints,
  calculateCompositeScore,
  generateRationale,
  type EligibilityInput,
  type EligibilityResult,
} from "@/lib/eligibility"
import { estimateProbabilityWithModel } from "@/lib/probability-model"
import { logger } from "@/lib/utils/logger"

/**
 * @swagger
 * /api/calculate/eligibility:
 *   post:
 *     summary: Calculate admission eligibility for a program
 *     tags: [Calculator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - utme
 *               - olevels
 *               - programId
 *             properties:
 *               utme:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 400
 *               olevels:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *               programId:
 *                 type: string
 *                 format: uuid
 *               stateOfOrigin:
 *                 type: string
 *               postUtme:
 *                 type: number
 *     responses:
 *       200:
 *         description: Eligibility calculation result
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Program not found
 *       500:
 *         description: Internal server error
 */
const eligibilitySchema = z.object({
  utme: z.number().min(0).max(400),
  olevels: z.record(z.string(), z.string()),
  programId: z.string().uuid(),
  stateOfOrigin: z.string().optional(),
  postUtme: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = eligibilitySchema.parse(body)

    // Fetch program with institution and cutoff history
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId },
      include: {
        institution: true,
      },
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

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

    // Parse cutoff history from JSON
    const cutoffHistory = program.cutoffHistory
      ? (Array.isArray(program.cutoffHistory)
          ? program.cutoffHistory
          : JSON.parse(JSON.stringify(program.cutoffHistory)))
      : []

    // Estimate probability using enhanced model
    const probabilityData = estimateProbabilityWithModel(compositeScore, cutoffHistory)

    // Generate rationale
    const rationale = generateRationale(
      compositeScore,
      validatedData.utme,
      olevelPoints,
      program.name,
      program.institution.name,
      cutoffHistory,
      probabilityData.probability,
      probabilityData.category
    )

    // Determine data quality
    const latestCutoff = cutoffHistory?.[0]
    const cutoffConfidence = latestCutoff?.confidence || "unverified"
    const historicalDataYears = cutoffHistory.length
    const lastUpdated = program.lastVerifiedAt?.toISOString()

    const result: EligibilityResult = {
      compositeScore,
      probability: probabilityData.probability,
      confidenceInterval: probabilityData.confidenceInterval,
      category: probabilityData.category,
      rationale,
      dataQuality: {
        cutoffConfidence: cutoffConfidence as "verified" | "estimated" | "unverified",
        historicalDataYears: historicalDataYears > 0 ? historicalDataYears : undefined,
        lastUpdated,
      },
      // Add enhanced model data
      modelType: probabilityData.modelType,
      features: probabilityData.features,
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error calculating eligibility", error, {
      endpoint: "/api/calculate/eligibility",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

