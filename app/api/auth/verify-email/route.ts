import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isTokenExpired } from "@/lib/utils/tokens"
import { sendEmail, getWelcomeEmailHtml } from "@/lib/email"
import { authRateLimits } from "@/lib/utils/rate-limit"

const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyEmailSchema.parse(body)

    // Rate limiting per token
    const rateLimitResult = await authRateLimits.verifyEmail(request, token)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many verification attempts. Please try again later.",
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
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    if (verificationToken.used) {
      return NextResponse.json(
        { error: "This verification token has already been used" },
        { status: 400 }
      )
    }

    if (isTokenExpired(verificationToken.expires)) {
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    if (verificationToken.type !== "email") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    }) as any

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          status: "active",
        } as any,
      }),
      prisma.verificationToken.update({
        where: { token },
        data: { used: true } as any,
      }),
    ])

    const profile = user.profile as any
    const name = profile?.name

    await sendEmail({
      to: user.email,
      subject: "Welcome to edurepoai.xyz! 🎉",
      html: getWelcomeEmailHtml(name),
    })

    return NextResponse.json({
      message: "Email verified successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error verifying email:", error)
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}

