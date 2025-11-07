"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface UseAuthGuardOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
  onUnauthenticated?: () => void
  onUnauthorized?: () => void
}

interface UseAuthGuardReturn {
  session: ReturnType<typeof useSession>["data"]
  status: ReturnType<typeof useSession>["status"]
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  isAuthorized: boolean
}

export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardReturn {
  const {
    requireAuth = false,
    requireAdmin = false,
    redirectTo,
    onUnauthenticated,
    onUnauthorized,
  } = options

  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isAuthenticated = status === "authenticated" && !!session?.user
  const isAdmin = isAuthenticated && session?.user?.roles?.includes("admin")
  const hasSession = session && session.user
  const isLoading = status === "loading" && !hasSession
  const isAuthorized = requireAdmin ? isAdmin : isAuthenticated

  // Handle redirects
  useEffect(() => {
    if (!requireAuth) return

    // Clear any pending redirects
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }

    if (status === "unauthenticated" && !hasRedirected.current && pathname && !pathname.startsWith("/auth/signin")) {
      hasRedirected.current = true
      
      if (onUnauthenticated) {
        onUnauthenticated()
      } else {
        const targetUrl = redirectTo || `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`
        redirectTimeoutRef.current = setTimeout(() => {
          router.replace(targetUrl)
        }, 100)
      }
    }

    if (requireAdmin && isAuthenticated && !isAdmin && !hasRedirected.current) {
      hasRedirected.current = true
      
      if (onUnauthorized) {
        onUnauthorized()
      } else {
        redirectTimeoutRef.current = setTimeout(() => {
          router.replace(redirectTo || "/")
        }, 100)
      }
    }

    // Reset redirect flag if status changes back to authenticated
    if (status === "authenticated") {
      hasRedirected.current = false
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }
  }, [status, isAuthenticated, isAdmin, requireAuth, requireAdmin, router, pathname, redirectTo, onUnauthenticated, onUnauthorized])

  return {
    session,
    status,
    isAuthenticated,
    isAdmin,
    isLoading,
    isAuthorized,
  }
}

