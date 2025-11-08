import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"

const feeCalculationSchema = z.object({
  programIds: z.array(z.string().uuid()).min(1).max(10),
  duration: z.number().min(1).max(10).optional(), // Years of study
  accommodation: z.boolean().optional(), // Include accommodation
  accommodationType: z.enum(["on_campus", "off_campus"]).optional(),
  otherExpenses: z.object({
    books: z.number().min(0).optional(),
    transport: z.number().min(0).optional(),
    feeding: z.number().min(0).optional(),
    miscellaneous: z.number().min(0).optional(),
  }).optional(),
})

interface FeeBreakdown {
  tuition: number
  accommodation: number
  books: number
  transport: number
  feeding: number
  miscellaneous: number
  total: number
  perYear: number
  totalDuration: number
}

interface FeeCalculationResult {
  programId: string
  programName: string
  institutionName: string
  institutionType: string
  duration: number
  breakdown: FeeBreakdown
  currency: string
  hasFeeData: boolean
  hasAccommodationData: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = feeCalculationSchema.parse(body)

    const { programIds, duration, accommodation, accommodationType, otherExpenses } = validatedData

    // Fetch programs with institution data
    const programs = await prisma.program.findMany({
      where: {
        id: {
          in: programIds,
        },
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            tuitionFees: true,
            feesSchedule: true,
          },
        },
      },
    })

    if (programs.length === 0) {
      return NextResponse.json(
        { error: "No programs found" },
        { status: 404 }
      )
    }

    const results: FeeCalculationResult[] = []

    for (const program of programs) {
      const programDuration = duration || parseInt(program.duration?.match(/\d+/)?.[0] || "4")
      const fees = (program.tuitionFees as any) || null
      const institutionFees = (program.institution.tuitionFees as any) || (program.institution.feesSchedule as any) || null

      // Get fee data from program or institution
      const feeData = fees || institutionFees
      const hasFeeData = !!feeData
      const hasAccommodationData = !!feeData?.accommodation

      // Calculate tuition fees
      let tuition = 0
      if (feeData?.amount) {
        tuition = feeData.per_year ? feeData.amount * programDuration : feeData.amount
      } else if (feeData?.schedule && Array.isArray(feeData.schedule)) {
        // Calculate from schedule
        const programFee = feeData.schedule.find(
          (item: any) => item.program === program.name || item.program === program.id
        )
        if (programFee) {
          tuition = programFee.per_year ? programFee.amount * programDuration : programFee.amount
        }
      }

      // Calculate accommodation costs
      let accommodationCost = 0
      if (accommodation && feeData?.accommodation) {
        const accData = feeData.accommodation
        if (accommodationType === "on_campus" && accData.on_campus) {
          accommodationCost = accData.on_campus.per_year 
            ? accData.on_campus.amount * programDuration 
            : accData.on_campus.amount
        } else if (accommodationType === "off_campus" && accData.off_campus) {
          accommodationCost = accData.off_campus.per_year 
            ? accData.off_campus.amount * programDuration 
            : accData.off_campus.amount
        } else if (accData.amount) {
          // Fallback to general accommodation amount
          accommodationCost = accData.per_year 
            ? accData.amount * programDuration 
            : accData.amount
        }
      }

      // Calculate other expenses
      const books = (otherExpenses?.books || 0) * programDuration
      const transport = (otherExpenses?.transport || 0) * programDuration
      const feeding = (otherExpenses?.feeding || 0) * programDuration
      const miscellaneous = (otherExpenses?.miscellaneous || 0) * programDuration

      // Calculate totals
      const total = tuition + accommodationCost + books + transport + feeding + miscellaneous
      const perYear = total / programDuration

      const breakdown: FeeBreakdown = {
        tuition,
        accommodation: accommodationCost,
        books,
        transport,
        feeding,
        miscellaneous,
        total,
        perYear,
        totalDuration: programDuration,
      }

      results.push({
        programId: program.id,
        programName: program.name,
        institutionName: program.institution.name,
        institutionType: program.institution.type,
        duration: programDuration,
        breakdown,
        currency: feeData?.currency || "NGN",
        hasFeeData,
        hasAccommodationData,
      })
    }

    return NextResponse.json({
      data: results,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }
    logger.error("Error calculating fees", error, {
      endpoint: "/api/calculate/fees",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

