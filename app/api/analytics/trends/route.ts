import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"
import { predictNextCutoff, predictFutureCutoffs, calculateTrend, getInsights } from "@/lib/utils/predictions"

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get trend analytics for programs
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *         description: Program ID to get trends for
 *       - in: query
 *         name: institutionId
 *         schema:
 *           type: string
 *         description: Institution ID to get trends for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of programs to return
 *     responses:
 *       200:
 *         description: Trend analytics data
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const programId = searchParams.get("programId")
    const institutionId = searchParams.get("institutionId")
    const limit = parseInt(searchParams.get("limit") || "10")

    let where: any = {}
    if (programId) {
      where.id = programId
    }
    if (institutionId) {
      where.institutionId = institutionId
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        institution: true,
      },
      take: limit,
    })

    const trends = programs.map((program) => {
      const history = Array.isArray(program.cutoffHistory)
        ? program.cutoffHistory
            .filter((h: any) => h.year && h.cutoff)
            .map((h: any) => ({
              year: parseInt(h.year),
              cutoff: parseInt(h.cutoff),
            }))
            .sort((a: any, b: any) => a.year - b.year)
        : []

      const trend = calculateTrend(history)
      const prediction = predictNextCutoff(history)
      const futurePredictions = predictFutureCutoffs(history, 3)
      const insights = getInsights(history)

      return {
        program: {
          id: program.id,
          name: program.name,
          institution: program.institution?.name,
        },
        historical: history,
        trend,
        prediction,
        futurePredictions,
        insights,
      }
    })

    return NextResponse.json({
      data: trends,
    })
  } catch (error) {
    logger.error("Error in analytics trends", error, {
      endpoint: "/api/analytics/trends",
      method: "GET",
    })

    return NextResponse.json(
      { error: "Failed to fetch trend analytics" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

