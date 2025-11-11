import { NextRequest } from "next/server"

interface RateLimitOptions {
  limit: number // Number of requests allowed
  window: number // Time window in seconds
  identifier?: string // Custom identifier (email, token, etc.)
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp when limit resets
}

// In-memory store for rate limiting (fallback when Redis unavailable)
const memoryStore = new Map<string, { count: number; reset: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (value.reset < now) {
      memoryStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0].trim() || realIP || "unknown"
  return ip
}

async function getIdentifier(
  request: NextRequest,
  options: RateLimitOptions
): Promise<string> {
  if (options.identifier) {
    return options.identifier
  }

  const ip = getClientIP(request)
  return `rate-limit:${ip}`
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const identifier = await getIdentifier(request, options)
  const now = Date.now()
  const windowMs = options.window * 1000
  const reset = now + windowMs

  // Try to use Redis/KV if available, otherwise fall back to memory
  try {
    // Check if we have a KV store available
    const kvModule = await import("@vercel/kv").catch(() => null)
    if (kvModule?.kv) {
      const { kv } = kvModule
      const key = identifier
      const current = await kv.get<number>(key)

      if (current === null) {
        // First request in window
        await kv.setex(key, options.window, 1)
        return {
          success: true,
          limit: options.limit,
          remaining: options.limit - 1,
          reset: Math.floor(reset / 1000),
        }
      }

      if (current >= options.limit) {
        // Rate limit exceeded
        const ttl = await kv.ttl(key)
        return {
          success: false,
          limit: options.limit,
          remaining: 0,
          reset: Math.floor((now + (ttl * 1000)) / 1000),
        }
      }

      // Increment counter
      await kv.incr(key)
      const newCount = (current || 0) + 1
      return {
        success: true,
        limit: options.limit,
        remaining: options.limit - newCount,
        reset: Math.floor(reset / 1000),
      }
    }
  } catch (error) {
    // KV not available, fall back to memory
    // Silently fall back - this is expected in development
  }

  // Memory-based rate limiting (fallback)
  const stored = memoryStore.get(identifier)

  if (!stored || stored.reset < now) {
    // First request or window expired
    memoryStore.set(identifier, { count: 1, reset })
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: Math.floor(reset / 1000),
    }
  }

  if (stored.count >= options.limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: Math.floor(stored.reset / 1000),
    }
  }

  // Increment counter
  stored.count++
  memoryStore.set(identifier, stored)

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - stored.count,
    reset: Math.floor(stored.reset / 1000),
  }
}

// Pre-configured rate limiters for common auth endpoints
export const authRateLimits = {
  register: (request: NextRequest) =>
    rateLimit(request, { limit: 5, window: 3600 }), // 5 per hour per IP

  signIn: (request: NextRequest) =>
    rateLimit(request, { limit: 10, window: 900 }), // 10 per 15 minutes per IP

  forgotPassword: async (request: NextRequest, email: string) =>
    rateLimit(request, { limit: 3, window: 3600, identifier: `forgot-password:${email}` }), // 3 per hour per email

  resendVerification: async (request: NextRequest, email: string) =>
    rateLimit(request, { limit: 3, window: 3600, identifier: `resend-verification:${email}` }), // 3 per hour per email

  verifyEmail: async (request: NextRequest, token: string) =>
    rateLimit(request, { limit: 10, window: 3600, identifier: `verify-email:${token}` }), // 10 per hour per token

  resetPassword: async (request: NextRequest, token: string) =>
    rateLimit(request, { limit: 5, window: 3600, identifier: `reset-password:${token}` }), // 5 per hour per token
}

