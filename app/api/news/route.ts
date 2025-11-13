import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS, PAGINATION } from "@/lib/constants"
import { getCached, generateCacheKey, CACHE_CONFIG, CACHE_TAGS } from "@/lib/cache"

export const dynamic = 'force-dynamic'

const newsQuerySchema = z.object({
  category: z.enum(["jamb", "post_utme", "nursing_schools", "admission", "nysc", "general", "scholarships", "cutoff_updates", "accreditation"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional().default("published"),
  featured: z.string().transform((val) => val === "true").optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(PAGINATION.DEFAULT_PAGE.toString()),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(PAGINATION.DEFAULT_LIMIT.toString()),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = newsQuerySchema.parse(params)

    const { category, status, featured, search, page, limit } = validatedParams

    const where: any = {
      status: status || "published",
    }

    if (category) {
      where.category = category
    }

    if (featured !== undefined) {
      where.featured = featured
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ]
    }

    const skip = (page - 1) * limit

    // Generate cache key
    const cacheKey = generateCacheKey("news", { category, status, featured, search, page, limit })

    // Fetch with caching
    const [news, total] = await getCached(
      cacheKey,
      async () => {
        return Promise.all([
          (prisma as any).news.findMany({
            where,
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              category: true,
              status: true,
              featured: true,
              imageUrl: true,
              tags: true,
              views: true,
              publishedAt: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: {
                  id: true,
                  email: true,
                  profile: true,
                },
              },
            },
            orderBy: [
              { featured: "desc" },
              { publishedAt: "desc" },
              { createdAt: "desc" },
            ],
            skip,
            take: limit,
          }),
          (prisma as any).news.count({ where }),
        ])
      },
      CACHE_CONFIG.STATS_TTL,
      [CACHE_TAGS.SEARCH]
    )

    return NextResponse.json({
      data: news,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error fetching news", error, {
      endpoint: "/api/news",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

