import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateToken, generateTokenExpiry } from "@/lib/utils/tokens"
import { sendEmail, getVerificationEmailHtml } from "@/lib/email"
import { authRateLimits } from "@/lib/utils/rate-limit"

const resendVerificationSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resendVerificationSchema.parse(body)

    // Rate limiting per email
    const rateLimitResult = await authRateLimits.resendVerification(request, email)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many verification email requests. Please try again later.",
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

    const token = generateToken()
    const expires = generateTokenExpiry(24)

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        type: "email",
        used: false,
      } as any,
    })

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        type: "email",
      } as any,
    })

    const profile = user.profile as any
    const name = profile?.name

    await sendEmail({
      to: email,
      subject: "Verify your email - edurepoai.xyz",
      html: getVerificationEmailHtml(token, name),
    })

    return NextResponse.json({
      message: "Verification email sent successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error resending verification email:", error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
}

