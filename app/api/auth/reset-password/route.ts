import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { isTokenExpired } from "@/lib/utils/tokens"
import { deleteAllUserSessions } from "@/lib/utils/sessions"
import { authRateLimits } from "@/lib/utils/rate-limit"

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Rate limiting per token
    const rateLimitResult = await authRateLimits.resetPassword(request, token)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many password reset attempts. Please try again later.",
          retryAfter: rateLimitResult.reset - Math.floor(Date.now() / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.reset - Math.floor(Date.now() / 1000)),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        }
      )
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    }) as any

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    if (verificationToken.used) {
      return NextResponse.json(
        { error: "This reset token has already been used" },
        { status: 400 }
      )
    }

    if (isTokenExpired(verificationToken.expires)) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    if (verificationToken.type !== "password_reset") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword },
      }),
      prisma.verificationToken.update({
        where: { token },
        data: { used: true } as any,
      }),
    ])

    await deleteAllUserSessions(user.id)

    return NextResponse.json({
      message: "Password reset successfully. Please sign in with your new password.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}

