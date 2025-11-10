"use client"

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

class AnalyticsTracker {
  private userId: string | null = null
  private sessionId: string = this.generateSessionId()

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string | null) {
    this.userId = userId
  }

  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date(),
        url: typeof window !== "undefined" ? window.location.href : "",
        path: typeof window !== "undefined" ? window.location.pathname : "",
      },
      userId: this.userId || undefined,
      timestamp: new Date(),
    }

    // Send to API
    if (typeof window !== "undefined") {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analyticsEvent),
      }).catch((error) => {
        console.error("Analytics tracking error:", error)
      })
    }
  }

  trackPageView(path: string, properties?: Record<string, any>) {
    this.track("page_view", {
      path,
      ...properties,
    })
  }

  trackUserJourney(step: string, properties?: Record<string, any>) {
    this.track("user_journey", {
      step,
      ...properties,
    })
  }

  trackConversion(type: string, value?: number, properties?: Record<string, any>) {
    this.track("conversion", {
      type,
      value,
      ...properties,
    })
  }

  trackEngagement(action: string, properties?: Record<string, any>) {
    this.track("engagement", {
      action,
      ...properties,
    })
  }
}

export const analytics = new AnalyticsTracker()

