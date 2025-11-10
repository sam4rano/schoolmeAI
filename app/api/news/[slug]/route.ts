import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"
import { getCached, generateCacheKey, CACHE_CONFIG, CACHE_TAGS } from "@/lib/cache"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    // Generate cache key
    const cacheKey = generateCacheKey("news-detail", { slug })

    // Fetch with caching
    const news = await getCached(
      cacheKey,
      async () => {
        const article = await (prisma as any).news.findUnique({
          where: { slug },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            category: true,
            status: true,
            featured: true,
            imageUrl: true,
            sourceUrl: true,
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
        })

        if (!article) {
          return null
        }

        // Increment view count (don't await to avoid blocking)
        (prisma as any).news.update({
          where: { id: article.id },
          data: { views: { increment: 1 } },
        }).catch((err: unknown) => {
          logger.error("Error incrementing news views", err)
        })

        return article
      },
      CACHE_CONFIG.STATS_TTL,
      [CACHE_TAGS.SEARCH]
    )

    if (!news) {
      return NextResponse.json(
        { error: "News article not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    return NextResponse.json({ data: news })
  } catch (error) {
    logger.error("Error fetching news article", error, {
      endpoint: "/api/news/[slug]",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

