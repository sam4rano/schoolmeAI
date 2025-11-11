import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { logger } from "@/lib/utils/logger"
import { generateToken, generateTokenExpiry } from "@/lib/utils/tokens"
import { sendEmail, getVerificationEmailHtml } from "@/lib/email"
import { authRateLimits } from "@/lib/utils/rate-limit"

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid request data or user already exists
 *       500:
 *         description: Internal server error
 */
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await authRateLimits.register(request)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many registration attempts. Please try again later.",
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

  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Generate verification token
    const verificationToken = generateToken()
    const tokenExpires = generateTokenExpiry(24)

    // Create user with pending verification status
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        hashedPassword,
        status: "pending_verification",
        profile: validatedData.name
          ? ({
              name: validatedData.name,
            } as any)
          : undefined,
      } as any,
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true,
      },
    })

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: validatedData.email,
        token: verificationToken,
        expires: tokenExpires,
        type: "email",
      } as any,
    })

    // Send verification email
    await sendEmail({
      to: validatedData.email,
      subject: "Verify your email - edurepoai.xyz",
      html: getVerificationEmailHtml(verificationToken, validatedData.name),
    })

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    logger.error("Error registering user", error, {
      endpoint: "/api/auth/register",
      method: "POST",
      errorMessage,
      errorStack,
    })

    // In development, return more details
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { 
          error: "Internal server error",
          message: errorMessage,
          ...(errorStack && { stack: errorStack }),
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

