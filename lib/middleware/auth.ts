/**
 * Authentication middleware utilities
 * Provides reusable authentication checks for API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { HTTP_STATUS } from "@/lib/constants"
import { logger } from "@/lib/utils/logger"

export interface AuthenticatedSession {
  user: {
    id: string
    email: string
    roles?: string[]
  }
}

/**
 * Get authenticated session
 * Returns session or null if not authenticated
 */
export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }
    return session as AuthenticatedSession
  } catch (error) {
    logger.error("Error getting session", error, {
      context: "getAuthenticatedSession",
    })
    return null
  }
}

/**
 * Require authentication middleware
 * Returns session or error response
 */
export async function requireAuth(): Promise<
  | { session: AuthenticatedSession }
  | { response: NextResponse }
> {
  const session = await getAuthenticatedSession()
  
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized. Please sign in to continue." },
        { status: HTTP_STATUS.UNAUTHORIZED }
      ),
    }
  }

  return { session }
}

/**
 * Require authentication with specific role
 * Returns session or error response
 */
export async function requireRole(
  role: string
): Promise<
  | { session: AuthenticatedSession }
  | { response: NextResponse }
> {
  const authResult = await requireAuth()
  
  if ("response" in authResult) {
    return authResult
  }

  const { session } = authResult
  const userRoles = session.user.roles || []
  
  if (!userRoles.includes(role)) {
    return {
      response: NextResponse.json(
        { error: `Forbidden. This action requires ${role} role.` },
        { status: HTTP_STATUS.FORBIDDEN }
      ),
    }
  }

  return { session }
}

/**
 * Check if user is admin
 */
export function isAdmin(session: AuthenticatedSession): boolean {
  return session.user.roles?.includes("admin") ?? false
}

/**
 * Check if user owns resource
 */
export function isOwner(
  session: AuthenticatedSession,
  resourceUserId: string
): boolean {
  return session.user.id === resourceUserId
}

/**
 * Check if user can access resource (owner or admin)
 */
export function canAccess(
  session: AuthenticatedSession,
  resourceUserId: string
): boolean {
  return isAdmin(session) || isOwner(session, resourceUserId)
}

