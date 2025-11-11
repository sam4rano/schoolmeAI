import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { getVerificationEmailHtml, getPasswordResetEmailHtml, getWelcomeEmailHtml } from "@/lib/email/templates"
import { requireAuth } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  // Allow testing in development, require auth in production
  if (process.env.NODE_ENV === "production") {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
  }

  try {
    const body = await request.json()
    const { email, type = "verification" } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    let subject: string
    let html: string

    switch (type) {
      case "verification":
        subject = "Test: Email Verification - edurepoai.xyz"
        html = getVerificationEmailHtml("test-token-12345", "Test User")
        break
      case "password-reset":
        subject = "Test: Password Reset - edurepoai.xyz"
        html = getPasswordResetEmailHtml("test-token-12345", "Test User")
        break
      case "welcome":
        subject = "Test: Welcome Email - edurepoai.xyz"
        html = getWelcomeEmailHtml("Test User")
        break
      default:
        return NextResponse.json(
          { error: "Invalid email type. Use: verification, password-reset, or welcome" },
          { status: 400 }
        )
    }

    const result = await sendEmail({
      to: email,
      subject,
      html,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: result.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent successfully to ${email}`,
      emailId: result.id,
      type,
    })
  } catch (error) {
    console.error("Error in test email endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Email test endpoint",
    usage: "POST with { email: 'your@email.com', type: 'verification' | 'password-reset' | 'welcome' }",
    example: {
      email: "test@example.com",
      type: "verification",
    },
  })
}

