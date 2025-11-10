"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { analytics } from "@/lib/analytics/tracker"
import { useSession } from "next-auth/react"

export function PageViewTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.id) {
      analytics.setUserId(session.user.id)
    }
  }, [session])

  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname, {
        referrer: typeof document !== "undefined" ? document.referrer : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      })
    }
  }, [pathname])

  return null
}

