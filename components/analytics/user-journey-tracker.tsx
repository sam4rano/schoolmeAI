"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { analytics } from "@/lib/analytics/tracker"

interface UserJourneyTrackerProps {
  step: string
  properties?: Record<string, any>
}

export function UserJourneyTracker({ step, properties }: UserJourneyTrackerProps) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.id) {
      analytics.setUserId(session.user.id)
    }
  }, [session])

  useEffect(() => {
    analytics.trackUserJourney(step, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
  }, [step, properties])

  return null
}

