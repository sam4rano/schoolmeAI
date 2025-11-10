import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const storySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  institutionId: z.string().optional(),
  programId: z.string().optional(),
  utmeScore: z.number().min(0).max(400).optional(),
  admissionYear: z.number().min(2000).max(2100).optional(),
})

/**
 * @swagger
 * /api/community/stories:
 *   get:
 *     summary: Get user stories
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
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
 *     summary: Share a success story
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") as any
    const featured = searchParams.get("featured") === "true"
    const institutionId = searchParams.get("institutionId")
    const programId = searchParams.get("programId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const skip = (page - 1) * limit

    const where: any = {
      status: status || "approved", // Only show approved stories by default
    }
    if (featured) {
      where.featured = true
    }
    if (institutionId) {
      where.institutionId = institutionId
    }
    if (programId) {
      where.programId = programId
    }

    const [stories, total] = await Promise.all([
      prisma.userStory.findMany({
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
        },
        orderBy: [
          { featured: "desc" },
          { likes: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.userStory.count({ where }),
    ])

    return NextResponse.json({
      data: stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error fetching user stories", error, {
      endpoint: "/api/community/stories",
      method: "GET",
    })

    return NextResponse.json(
      { error: "Failed to fetch user stories" },
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
    const validatedData = storySchema.parse(body)

    const story = await prisma.userStory.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        content: validatedData.content,
        institutionId: validatedData.institutionId,
        programId: validatedData.programId,
        utmeScore: validatedData.utmeScore,
        admissionYear: validatedData.admissionYear,
        status: "pending", // Requires moderation
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

    return NextResponse.json({ data: story }, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error creating user story", error, {
      endpoint: "/api/community/stories",
      method: "POST",
    })

    return NextResponse.json(
      { error: "Failed to create user story" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

