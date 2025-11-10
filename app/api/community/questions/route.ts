import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const questionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional(),
  institutionId: z.string().optional(),
  programId: z.string().optional(),
})

/**
 * @swagger
 * /api/community/questions:
 *   get:
 *     summary: Get questions
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, answered, closed, resolved]
 *       - in: query
 *         name: institutionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *   post:
 *     summary: Ask a question
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") as any
    const institutionId = searchParams.get("institutionId")
    const programId = searchParams.get("programId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (institutionId) {
      where.institutionId = institutionId
    }
    if (programId) {
      where.programId = programId
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              answers: true,
            },
          },
        },
        orderBy: [
          { upvotes: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.question.count({ where }),
    ])

    return NextResponse.json({
      data: questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error fetching questions", error, {
      endpoint: "/api/community/questions",
      method: "GET",
    })

    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    const question = await prisma.question.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        content: validatedData.content,
        tags: validatedData.tags || [],
        institutionId: validatedData.institutionId,
        programId: validatedData.programId,
        status: "open",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ data: question }, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error creating question", error, {
      endpoint: "/api/community/questions",
      method: "POST",
    })

    return NextResponse.json(
      { error: "Failed to create question" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

