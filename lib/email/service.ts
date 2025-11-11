import sgMail from "@sendgrid/mail"

// Initialize SendGrid API key (must be set before sending emails)
function initializeApiKey() {
  if (process.env.SENDGRID_API_KEY) {
    const apiKey = process.env.SENDGRID_API_KEY.trim().replace(/^["'`]|["'`]$/g, "")
    if (apiKey.startsWith("SG.")) {
      sgMail.setApiKey(apiKey)
    }
  }
}

// Initialize on module load
initializeApiKey()

// Optional: Set data residency for EU subusers
// sgMail.setDataResidency('eu')

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@edurepoai.xyz"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not configured. Email not sent:", options.to)
    return { success: false, error: "Email service not configured" }
  }

  // Ensure API key is set and clean (remove quotes, whitespace)
  const apiKey = process.env.SENDGRID_API_KEY.trim().replace(/^["'`]|["'`]$/g, "")
  
  if (!apiKey.startsWith("SG.")) {
    console.error("API key does not start with 'SG.'. Please verify your SENDGRID_API_KEY.")
    return { success: false, error: "Invalid API key format" }
  }
  
  // Re-initialize to ensure it's set (in case env changed)
  sgMail.setApiKey(apiKey)

  try {
    const msg = {
      to: options.to,
      from: FROM_EMAIL, // Must be a verified sender in SendGrid
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      html: options.html,
    }

    const result = await sgMail.send(msg)

    return { success: true, id: result[0]?.headers?.["x-message-id"] || "sent" }
  } catch (error: any) {
    console.error("Error sending email:", error)
    
    // SendGrid specific error handling
    if (error.response) {
      const errorBody = error.response.body
      console.error("SendGrid error details:", JSON.stringify(errorBody, null, 2))
      
      // Provide more helpful error messages
      if (error.response.statusCode === 401) {
        return { 
          success: false, 
          error: "SendGrid API key is invalid or expired. Please check your SENDGRID_API_KEY in .env file." 
        }
      }
      
      if (error.response.statusCode === 403) {
        return { 
          success: false, 
          error: "SendGrid API key lacks required permissions. Ensure it has 'Mail Send' permissions." 
        }
      }
      
      // Handle unverified sender email
      if (error.response.statusCode === 400 && errorBody?.errors) {
        const errors = errorBody.errors
        const unverifiedSender = errors.find((e: any) => 
          e.message?.includes("sender") || e.message?.includes("verified")
        )
        if (unverifiedSender) {
          return { 
            success: false, 
            error: `Sender email ${FROM_EMAIL} is not verified in SendGrid. Please verify it in SendGrid dashboard.` 
          }
        }
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

export function getVerificationUrl(token: string): string {
  return `${APP_URL}/auth/verify-email?token=${token}`
}

export function getPasswordResetUrl(token: string): string {
  return `${APP_URL}/auth/reset-password?token=${token}`
}

