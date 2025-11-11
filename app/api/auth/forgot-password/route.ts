import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateToken, generateTokenExpiry } from "@/lib/utils/tokens"
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email"
import { authRateLimits } from "@/lib/utils/rate-limit"

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Rate limiting per email
    const rateLimitResult = await authRateLimits.forgotPassword(request, email)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many password reset requests. Please try again later.",
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

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, a password reset link has been sent.",
      })
    }

    if (!user.hashedPassword) {
      return NextResponse.json({
        message: "If an account exists with this email, a password reset link has been sent.",
      })
    }

    const token = generateToken()
    const expires = generateTokenExpiry(1)

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        type: "password_reset",
        used: false,
      } as any,
    })

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        type: "password_reset",
      } as any,
    })

    const profile = user.profile as any
    const name = profile?.name

    await sendEmail({
      to: email,
      subject: "Reset your password - edurepoai.xyz",
      html: getPasswordResetEmailHtml(token, name),
    })

    return NextResponse.json({
      message: "If an account exists with this email, a password reset link has been sent.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error sending password reset email:", error)
    return NextResponse.json(
      { error: "Failed to send password reset email" },
      { status: 500 }
    )
  }
}

