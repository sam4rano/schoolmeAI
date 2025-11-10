"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, TrendingUp, Calendar, Award, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface WatchlistAnalyticsProps {
  watchlistItems: any[]
}

export function WatchlistAnalytics({ watchlistItems }: WatchlistAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (watchlistItems.length === 0) {
      setLoading(false)
      return
    }

    // Calculate analytics
    const totalPrograms = watchlistItems.length
    const highPriority = watchlistItems.filter((item) => item.priority === "high").length
    const mediumPriority = watchlistItems.filter((item) => item.priority === "medium").length
    const lowPriority = watchlistItems.filter((item) => item.priority === "low").length

    // Count by institution type
    const institutionTypes: Record<string, number> = {}
    watchlistItems.forEach((item) => {
      const type = item.program?.institution?.type || "unknown"
      institutionTypes[type] = (institutionTypes[type] || 0) + 1
    })

    // Count by state
    const states: Record<string, number> = {}
    watchlistItems.forEach((item) => {
      const state = item.program?.institution?.state || "unknown"
      states[state] = (states[state] || 0) + 1
    })

    // Count programs with deadlines
    const programsWithDeadlines = watchlistItems.filter((item) => {
      const deadline = item.program?.applicationDeadline
      return deadline && new Date(deadline) > new Date()
    }).length

    // Count urgent deadlines (within 7 days)
    const urgentDeadlines = watchlistItems.filter((item) => {
      const deadline = item.program?.applicationDeadline
      if (!deadline) return false
      const daysRemaining = Math.ceil(
        (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysRemaining > 0 && daysRemaining <= 7
    }).length

    // Count accredited programs
    const accreditedPrograms = watchlistItems.filter(
      (item) => item.program?.accreditationStatus === "Full"
    ).length

    setAnalytics({
      totalPrograms,
      highPriority,
      mediumPriority,
      lowPriority,
      institutionTypes,
      states,
      programsWithDeadlines,
      urgentDeadlines,
      accreditedPrograms,
    })
    setLoading(false)
  }, [watchlistItems])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Watchlist Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics || analytics.totalPrograms === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Watchlist Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Priority Breakdown */}
          <div>
            <p className="text-sm font-semibold mb-2">Priority Breakdown</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-destructive/10 rounded-md text-center">
                <p className="text-lg font-bold text-destructive">{analytics.highPriority}</p>
                <p className="text-xs text-muted-foreground">High</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-md text-center">
                <p className="text-lg font-bold text-primary">{analytics.mediumPriority}</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </div>
              <div className="p-2 bg-secondary/10 rounded-md text-center">
                <p className="text-lg font-bold">{analytics.lowPriority}</p>
                <p className="text-xs text-muted-foreground">Low</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">With Deadlines</p>
              </div>
              <p className="text-xl font-bold">{analytics.programsWithDeadlines}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-red-600" />
                <p className="text-xs text-muted-foreground">Urgent (≤7 days)</p>
              </div>
              <p className="text-xl font-bold text-red-600">{analytics.urgentDeadlines}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Accredited</p>
              </div>
              <p className="text-xl font-bold text-green-600">{analytics.accreditedPrograms}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Total Programs</p>
              </div>
              <p className="text-xl font-bold">{analytics.totalPrograms}</p>
            </div>
          </div>

          {/* Institution Types */}
          {Object.keys(analytics.institutionTypes).length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">By Institution Type</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.institutionTypes).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}: {String(count)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Top States */}
          {Object.keys(analytics.states).length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Top States</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.states)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([state, count]) => (
                    <Badge key={state} variant="outline" className="text-xs">
                      {state}: {String(count)}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

