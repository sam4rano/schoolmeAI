import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
      include: {
        programs: {
          select: {
            id: true,
            degreeType: true,
            accreditationStatus: true,
            cutoffHistory: true,
          },
        },
      },
    })

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      )
    }

    const programs = institution.programs
    const totalPrograms = programs.length
    const accreditedPrograms = programs.filter(
      (p) => p.accreditationStatus === "Full"
    ).length

    // Calculate average cutoff
    let totalCutoff = 0
    let cutoffCount = 0
    programs.forEach((program) => {
      if (program.cutoffHistory) {
        const cutoffHistory = Array.isArray(program.cutoffHistory)
          ? program.cutoffHistory
          : []
        if (cutoffHistory.length > 0) {
          const latestCutoff = cutoffHistory[0]
          if (latestCutoff !== null && latestCutoff !== undefined) {
            let cutoff: number | string | undefined
            if (typeof latestCutoff === "object" && latestCutoff !== null && !Array.isArray(latestCutoff)) {
              cutoff = (latestCutoff as any).cutoff
            } else {
              cutoff = latestCutoff as number | string
            }
            const cutoffValue = typeof cutoff === "number" ? cutoff : parseFloat(String(cutoff || "")) || 0
            if (cutoffValue > 0) {
              totalCutoff += cutoffValue
              cutoffCount++
            }
          }
        }
      }
    })
    const averageCutoff = cutoffCount > 0 ? totalCutoff / cutoffCount : 0

    // Count programs by degree type
    const programTypes: Record<string, number> = {}
    programs.forEach((program) => {
      if (program.degreeType) {
        programTypes[program.degreeType] = (programTypes[program.degreeType] || 0) + 1
      }
    })

    return NextResponse.json({
      data: {
        totalPrograms,
        accreditedPrograms,
        averageCutoff: Math.round(averageCutoff * 10) / 10,
        programTypes,
      },
    })
  } catch (error) {
    logger.error("Error fetching institution statistics", error, {
      endpoint: `/api/institutions/${params.id}/statistics`,
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

