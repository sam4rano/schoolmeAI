import { NextRequest } from "next/server"
import { authRateLimits } from "./rate-limit"

// Rate limit sign-in attempts
export async function checkSignInRateLimit(request: NextRequest): Promise<{
  allowed: boolean
  error?: string
  retryAfter?: number
}> {
  const rateLimitResult = await authRateLimits.signIn(request)

  if (!rateLimitResult.success) {
    return {
      allowed: false,
      error: "Too many sign-in attempts. Please try again later.",
      retryAfter: rateLimitResult.reset - Math.floor(Date.now() / 1000),
    }
  }

  return { allowed: true }
}

