import crypto from "crypto"

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function generateTokenExpiry(hours: number = 24): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hours)
  return expiry
}

export function isTokenExpired(expires: Date): boolean {
  return new Date() > expires
}

