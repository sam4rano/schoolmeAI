import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

const MAX_CONCURRENT_SESSIONS = 5

export interface SessionInfo {
  userAgent?: string
  ipAddress?: string
  deviceInfo?: string
}

export async function getSessionInfo(): Promise<SessionInfo> {
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || undefined
  const forwarded = headersList.get("x-forwarded-for")
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || undefined

  let deviceInfo: string | undefined
  if (userAgent) {
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
    const isTablet = /Tablet|iPad/i.test(userAgent)
    const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || "Unknown"
    deviceInfo = `${isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"} - ${os}`
  }

  return {
    userAgent,
    ipAddress,
    deviceInfo,
  }
}

export async function createSession(
  userId: string,
  sessionToken: string,
  expires: Date,
  sessionInfo?: SessionInfo
) {
  const info = sessionInfo || (await getSessionInfo())

  return await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      userAgent: info.userAgent,
      ipAddress: info.ipAddress,
      deviceInfo: info.deviceInfo,
    },
  })
}

export async function updateSessionActivity(sessionToken: string) {
  return await prisma.session.update({
    where: { sessionToken },
    data: { lastActiveAt: new Date() },
  })
}

export async function getUserSessions(userId: string) {
  return await prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { lastActiveAt: "desc" },
  })
}

export async function deleteSession(sessionToken: string) {
  return await prisma.session.delete({
    where: { sessionToken },
  })
}

export async function deleteAllUserSessions(userId: string, excludeToken?: string) {
  const where: any = {
    userId,
  }

  if (excludeToken) {
    where.sessionToken = { not: excludeToken }
  }

  return await prisma.session.deleteMany({
    where,
  })
}

export async function enforceSessionLimit(userId: string, currentToken?: string) {
  const sessions = await getUserSessions(userId)
  
  if (sessions.length >= MAX_CONCURRENT_SESSIONS) {
    const sessionsToDelete = sessions
      .filter((s) => !currentToken || s.sessionToken !== currentToken)
      .sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime())
      .slice(0, sessions.length - MAX_CONCURRENT_SESSIONS + 1)

    for (const session of sessionsToDelete) {
      await deleteSession(session.sessionToken)
    }
  }
}

export async function cleanupExpiredSessions() {
  return await prisma.session.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  })
}

