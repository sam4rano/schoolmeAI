/**
 * Email Notification Service
 * Sends email notifications for various events
 */

import { sendEmail } from "./service"
import { logger } from "@/lib/utils/logger"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"

/**
 * Send deadline reminder email
 */
export async function sendDeadlineReminderEmail(options: {
  to: string
  name?: string
  programName: string
  deadline: Date
  institutionName: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, name, programName, deadline, institutionName } = options
  
  const subject = `Application Deadline Reminder: ${programName}`
  const deadlineStr = deadline.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Deadline Reminder</h1>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name || "there"},</p>
    <p style="font-size: 16px; margin-bottom: 20px;">This is a reminder that the application deadline for <strong>${programName}</strong> at <strong>${institutionName}</strong> is approaching.</p>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="font-size: 18px; font-weight: 600; color: #92400e; margin: 0;">Deadline: ${deadlineStr}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/programs/${programName}" style="background: #f5576c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">View Program Details</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Don't miss out on this opportunity! Make sure to submit your application before the deadline.</p>
  </div>
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2025 edurepoai.xyz. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
  
  try {
    const result = await sendEmail({ to, subject, html })
    return result
  } catch (error) {
    logger.error("Failed to send deadline reminder email", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Send watchlist update email
 */
export async function sendWatchlistUpdateEmail(options: {
  to: string
  name?: string
  updates: Array<{
    type: "new" | "updated" | "cutoff" | "fee"
    programName: string
    institutionName: string
    message: string
  }>
}): Promise<{ success: boolean; error?: string }> {
  const { to, name, updates } = options
  
  const subject = `Watchlist Updates: ${updates.length} program${updates.length > 1 ? "s" : ""} updated`
  
  const updatesHtml = updates.map((update) => {
    const icon = update.type === "new" ? "🆕" : update.type === "updated" ? "📝" : update.type === "cutoff" ? "📊" : "💰"
    return `
      <div style="background: #f9fafb; padding: 16px; margin: 12px 0; border-radius: 8px; border-left: 4px solid #667eea;">
        <p style="margin: 0; font-size: 16px;">
          <strong>${icon} ${update.programName}</strong> at ${update.institutionName}
        </p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">${update.message}</p>
      </div>
    `
  }).join("")
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Watchlist Updates</h1>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name || "there"},</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Your watchlist has been updated with the following changes:</p>
    ${updatesHtml}
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/watchlist" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">View Watchlist</a>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2025 edurepoai.xyz. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
  
  try {
    const result = await sendEmail({ to, subject, html })
    return result
  } catch (error) {
    logger.error("Failed to send watchlist update email", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Send admin notification email
 */
export async function sendAdminNotificationEmail(options: {
  to: string
  subject: string
  changes?: string
  message?: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, subject, changes, message } = options
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Admin Notification</h1>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello Admin,</p>
    ${message ? `<p style="font-size: 16px; margin-bottom: 20px;">${message}</p>` : ""}
    ${changes ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="font-size: 14px; color: #92400e; margin: 0;"><strong>Changes:</strong> ${changes}</p>
      </div>
    ` : ""}
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/admin" style="background: #f5576c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">View Dashboard</a>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2025 edurepoai.xyz. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
  
  try {
    const result = await sendEmail({ to, subject, html })
    return result
  } catch (error) {
    logger.error("Failed to send admin notification email", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

