/**
 * Cache utility - unified interface for caching
 * Uses Next.js unstable_cache for production and memory cache for development
 */

import { unstable_cache } from "next/cache"
import { memoryCache } from "./memory-cache"
import { DATABASE } from "@/lib/constants"

const DEFAULT_TTL = DATABASE.CACHE_TTL_SECONDS || 3600 // 1 hour

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join("|")
  return `${prefix}:${sortedParams}`
}

/**
 * Get cached value
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL,
  tags?: string[]
): Promise<T> {
  // In development or when Next.js cache is not available, use memory cache
  if (process.env.NODE_ENV === "development" || !unstable_cache) {
    const cached = memoryCache.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    memoryCache.set(key, value, ttlSeconds)
    return value
  }

  // Use Next.js unstable_cache for production
  const cached = unstable_cache(
    fetcher,
    [key],
    {
      revalidate: ttlSeconds,
      tags: tags || [],
    }
  )

  return cached()
}

/**
 * Invalidate cache by key
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key)
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCachePattern(pattern: string): void {
  memoryCache.deletePattern(pattern)
}

/**
 * Invalidate cache by tags (for Next.js cache)
 */
export async function invalidateCacheByTags(tags: string[]): Promise<void> {
  // This would use Next.js revalidateTag in production
  // For now, we'll invalidate memory cache patterns
  for (const tag of tags) {
    memoryCache.deletePattern(`.*:${tag}:.*`)
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  memoryCache.clear()
}

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  INSTITUTIONS_TTL: 3600, // 1 hour
  PROGRAMS_TTL: 3600, // 1 hour
  RECOMMENDATIONS_TTL: 1800, // 30 minutes
  STATS_TTL: 300, // 5 minutes
  SEARCH_TTL: 600, // 10 minutes
} as const

/**
 * Cache tags for invalidation
 */
export const CACHE_TAGS = {
  INSTITUTIONS: "institutions",
  PROGRAMS: "programs",
  RECOMMENDATIONS: "recommendations",
  STATS: "stats",
  SEARCH: "search",
} as const

