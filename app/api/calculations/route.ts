import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { requireAuth } from "@/lib/middleware/auth"
import { HTTP_STATUS } from "@/lib/constants"

const calculationSchema = z.object({
  programId: z.string().uuid(),
  utme: z.number().min(0).max(400),
  olevels: z.record(z.string()),
  compositeScore: z.number(),
  probability: z.number().min(0).max(1).optional(),
  category: z.enum(["safe", "target", "reach"]),
  rationale: z.string().optional(),
  result: z.any(), // Full eligibility result object
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get("programId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
    }

    if (programId) {
      where.programId = programId
    }

    const [calculations, total] = await Promise.all([
      (prisma as any).calculation.findMany({
        where,
        select: {
          id: true,
          programId: true,
          utme: true,
          olevels: true,
          compositeScore: true,
          probability: true,
          category: true,
          rationale: true,
          result: true,
          createdAt: true,
          updatedAt: true,
          program: {
            select: {
              id: true,
              name: true,
              degreeType: true,
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
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      (prisma as any).calculation.count({ where }),
    ])

    return NextResponse.json({
      data: calculations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error fetching calculations", error, {
      endpoint: "/api/calculations",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const validatedData = calculationSchema.parse(body)

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId },
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    const calculation = await (prisma as any).calculation.create({
      data: {
        userId: session.user.id,
        programId: validatedData.programId,
        utme: validatedData.utme,
        olevels: validatedData.olevels,
        compositeScore: validatedData.compositeScore,
        probability: validatedData.probability,
        category: validatedData.category,
        rationale: validatedData.rationale,
        result: validatedData.result,
      },
      include: {
        program: {
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
        },
      },
    })

    return NextResponse.json(
      {
        message: "Calculation saved",
        data: calculation,
      },
      { status: HTTP_STATUS.CREATED }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error saving calculation", error, {
      endpoint: "/api/calculations",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

