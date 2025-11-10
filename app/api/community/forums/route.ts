import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const postSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
})

/**
 * @swagger
 * /api/community/forums:
 *   get:
 *     summary: Get forum posts
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
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
 *     summary: Create a forum post
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - title
 *               - content
 *             properties:
 *               categoryId:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get("categoryId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const skip = (page - 1) * limit

    const where: any = {
      status: "published",
    }
    if (categoryId) {
      where.categoryId = categoryId
    }

    const [posts, total] = await Promise.all([
      (prisma as any).forumPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          category: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          { isPinned: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      (prisma as any).forumPost.count({ where }),
    ])

    return NextResponse.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error fetching forum posts", error, {
      endpoint: "/api/community/forums",
      method: "GET",
    })

    return NextResponse.json(
      { error: "Failed to fetch forum posts" },
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
    const validatedData = postSchema.parse(body)

    const post = await (prisma as any).forumPost.create({
      data: {
        userId: session.user.id,
        categoryId: validatedData.categoryId,
        title: validatedData.title,
        content: validatedData.content,
        status: "published",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json({ data: post }, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error creating forum post", error, {
      endpoint: "/api/community/forums",
      method: "POST",
    })

    return NextResponse.json(
      { error: "Failed to create forum post" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

