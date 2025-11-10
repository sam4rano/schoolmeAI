import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/middleware/auth"
import { HTTP_STATUS } from "@/lib/constants"
import { z } from "zod"

const syncSchema = z.object({
  calculations: z.array(
    z.object({
      id: z.string(),
      timestamp: z.number(),
      utme: z.number(),
      olevels: z.record(z.string()),
      programId: z.string().uuid(),
      programName: z.string(),
      institutionName: z.string(),
      result: z.any(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const { calculations } = syncSchema.parse(body)

    // Get existing calculations from database
    const existingCalculations = await prisma.calculation.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        createdAt: true,
        programId: true,
        utme: true,
      },
    })

    // Create a map of existing calculations by timestamp and programId
    const existingMap = new Map<string, any>()
    existingCalculations.forEach((calc) => {
      const key = `${calc.programId}-${calc.utme}-${calc.createdAt.getTime()}`
      existingMap.set(key, calc)
    })

    // Filter out calculations that already exist
    const newCalculations = calculations.filter((calc) => {
      const key = `${calc.programId}-${calc.utme}-${calc.timestamp}`
      return !existingMap.has(key)
    })

    if (newCalculations.length === 0) {
      return NextResponse.json({
        message: "No new calculations to sync",
        data: { synced: 0, skipped: calculations.length },
      })
    }

    // Save new calculations
    const saved = await Promise.all(
      newCalculations.map((calc) =>
        prisma.calculation.create({
          data: {
            userId: session.user.id,
            programId: calc.programId,
            utme: calc.utme,
            olevels: calc.olevels,
            compositeScore: calc.result.compositeScore || 0,
            probability: calc.result.probability,
            category: calc.result.category || "target",
            rationale: calc.result.rationale,
            result: calc.result,
            createdAt: new Date(calc.timestamp),
          },
        })
      )
    )

    return NextResponse.json({
      message: "Calculations synced",
      data: {
        synced: saved.length,
        skipped: calculations.length - saved.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error syncing calculations", error, {
      endpoint: "/api/calculations/sync",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

