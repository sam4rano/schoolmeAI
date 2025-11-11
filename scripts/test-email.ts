#!/usr/bin/env tsx
/**
 * Test script to verify SendGrid email sending
 * Usage: npx tsx scripts/test-email.ts your-email@example.com
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env") })

import { sendEmail } from "../lib/email"

async function testEmail() {
  const testEmail = process.argv[2]

  if (!testEmail) {
    console.error("❌ Please provide an email address")
    console.log("Usage: npx tsx scripts/test-email.ts your-email@example.com")
    process.exit(1)
  }

  console.log("🧪 Testing SendGrid email sending...")
  console.log(`📧 Sending test email to: ${testEmail}`)
  console.log(`📤 From: ${process.env.EMAIL_FROM || "noreply@edurepoai.xyz"}`)
  console.log("")

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: "🧪 Test Email from edurepoai.xyz",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello!</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              This is a test email from <strong>edurepoai.xyz</strong> to verify that SendGrid email sending is working correctly.
            </p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Test Details:</strong><br>
                • Service: SendGrid<br>
                • Domain: edurepoai.xyz<br>
                • Status: ✅ Configured<br>
                • Time: ${new Date().toLocaleString()}
              </p>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              If you received this email, your SendGrid integration is working perfectly! 🎉
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 edurepoai.xyz. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    })

    if (result.success) {
      console.log("✅ Email sent successfully!")
      console.log(`📬 Email ID: ${result.id}`)
      console.log("")
      console.log("📋 Next steps:")
      console.log("   1. Check your inbox (and spam folder)")
      console.log("   2. Verify the email was received")
      console.log("   3. Check SendGrid dashboard for delivery status")
      process.exit(0)
    } else {
      console.error("❌ Failed to send email")
      console.error(`Error: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Error sending test email:", error)
    process.exit(1)
  }
}

testEmail()

