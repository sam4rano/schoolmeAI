import { getVerificationUrl, getPasswordResetUrl } from "./service"

export function getVerificationEmailHtml(token: string, name?: string): string {
  const url = getVerificationUrl(token)
  const displayName = name || "there"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${displayName},</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Thank you for signing up for edurepoai.xyz! Please verify your email address to complete your registration and start using all features.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Verify Email Address</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${url}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This link will expire in 24 hours.</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you didn't create an account, you can safely ignore this email.</p>
  </div>
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2025 edurepoai.xyz. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

export function getPasswordResetEmailHtml(token: string, name?: string): string {
  const url = getPasswordResetUrl(token)
  const displayName = name || "there"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${displayName},</p>
    <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password for your edurepoai.xyz account. Click the button below to reset it.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="background: #f5576c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${url}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This link will expire in 1 hour.</p>
    <p style="font-size: 14px; color: #dc2626; margin-top: 20px; font-weight: 600;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
  </div>
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2025 edurepoai.xyz. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

export function getWelcomeEmailHtml(name?: string): string {
  const displayName = name || "there"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to edurepoai.xyz! 🎉</h1>
  </div>
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${displayName},</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Welcome to edurepoai.xyz! Your email has been verified and your account is now active.</p>
    <p style="font-size: 16px; margin-bottom: 20px;">You can now:</p>
    <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
      <li>Calculate your admission eligibility</li>
      <li>Get AI-powered recommendations</li>
      <li>Browse institutions and programs</li>
      <li>Track your application deadlines</li>
      <li>Access historical cutoff data</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/calculator" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Get Started</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
  </div>
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2025 edurepoai.xyz. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

