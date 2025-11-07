import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"

const createReviewSchema = z.object({
  entityType: z.enum(["institution", "program"]),
  entityId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(10).max(2000),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit a review." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)

    // Check if user already reviewed this entity
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: session.user.id,
          entityType: validatedData.entityType,
          entityId: validatedData.entityId,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this item. You can update your existing review." },
        { status: 400 }
      )
    }

    // Verify entity exists
    if (validatedData.entityType === "institution") {
      const institution = await prisma.institution.findUnique({
        where: { id: validatedData.entityId },
      })
      if (!institution) {
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 }
        )
      }
    } else {
      const program = await prisma.program.findUnique({
        where: { id: validatedData.entityId },
      })
      if (!program) {
        return NextResponse.json(
          { error: "Program not found" },
          { status: 404 }
        )
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        institutionId: validatedData.entityType === "institution" ? validatedData.entityId : null,
        programId: validatedData.entityType === "program" ? validatedData.entityId : null,
        rating: validatedData.rating,
        title: validatedData.title,
        content: validatedData.content,
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
      },
    })

    return NextResponse.json({
      data: review,
      message: "Review submitted successfully. It will be published after moderation.",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

const getReviewsSchema = z.object({
  entityType: z.enum(["institution", "program"]).optional(),
  entityId: z.string().uuid().optional(),
  status: z.enum(["pending", "approved", "rejected", "flagged"]).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  sortBy: z.enum(["newest", "oldest", "rating", "helpful"]).optional().default("newest"),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const validatedData = getReviewsSchema.parse({
      entityType: searchParams.get("entityType"),
      entityId: searchParams.get("entityId"),
      status: searchParams.get("status"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
    })

    const where: any = {}
    if (validatedData.entityType && validatedData.entityId) {
      where.entityType = validatedData.entityType
      where.entityId = validatedData.entityId
    }
    if (validatedData.status) {
      where.status = validatedData.status
    } else {
      // Default: only show approved reviews for non-admin users
      const session = await getServerSession(authOptions)
      const isAdmin = session?.user?.roles?.includes("admin")
      if (!isAdmin) {
        where.status = "approved"
      }
    }

    const orderBy: any = {}
    switch (validatedData.sortBy) {
      case "newest":
        orderBy.createdAt = "desc"
        break
      case "oldest":
        orderBy.createdAt = "asc"
        break
      case "rating":
        orderBy.rating = "desc"
        break
      case "helpful":
        orderBy.helpfulCount = "desc"
        break
    }

    const skip = (validatedData.page - 1) * validatedData.limit
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: validatedData.limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ])

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        ...where,
        status: "approved",
      },
      _avg: {
        rating: true,
      },
    })

    return NextResponse.json({
      data: reviews,
      meta: {
        total,
        page: validatedData.page,
        limit: validatedData.limit,
        totalPages: Math.ceil(total / validatedData.limit),
        averageRating: avgRating._avg.rating || 0,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

