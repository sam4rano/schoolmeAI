import { NextRequest, NextResponse } from "next/server"
import { authRateLimits } from "@/lib/utils/rate-limit"

export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimitFn: (request: NextRequest, ...args: any[]) => Promise<any>
): Promise<NextResponse> {
  const result = await rateLimitFn(request)

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: result.reset - Math.floor(Date.now() / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.reset - Math.floor(Date.now() / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    )
  }

  // Add rate limit headers to successful responses
  const response = await handler(request)
  response.headers.set("X-RateLimit-Limit", String(result.limit))
  response.headers.set("X-RateLimit-Remaining", String(result.remaining))
  response.headers.set("X-RateLimit-Reset", String(result.reset))

  return response
}

