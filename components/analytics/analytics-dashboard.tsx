"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react"

interface DashboardStats {
  totalPrograms: number
  programsWithHistory: number
  averageTrend: "increasing" | "decreasing" | "stable"
  topTrendingPrograms: Array<{
    name: string
    trend: string
    prediction: number | null
  }>
}

interface AnalyticsDashboardProps {
  stats: DashboardStats
}

export function AnalyticsDashboard({ stats }: AnalyticsDashboardProps) {
  const trendIcon = stats.averageTrend === "increasing" 
    ? <TrendingUp className="h-4 w-4" />
    : stats.averageTrend === "decreasing"
    ? <TrendingDown className="h-4 w-4" />
    : <Minus className="h-4 w-4" />

  const trendColor = stats.averageTrend === "increasing"
    ? "text-destructive"
    : stats.averageTrend === "decreasing"
    ? "text-primary"
    : "text-muted-foreground"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Data Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.programsWithHistory} / {stats.totalPrograms}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalPrograms > 0 
              ? `${Math.round((stats.programsWithHistory / stats.totalPrograms) * 100)}% programs with historical data`
              : "No data"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Overall Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-bold ${trendColor}`}>
              {stats.averageTrend}
            </div>
            <div className={trendColor}>
              {trendIcon}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average trend across all programs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Top Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topTrendingPrograms.slice(0, 3).map((program, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1">{program.name}</span>
                {program.prediction && (
                  <Badge variant="outline" className="ml-2">
                    {program.prediction}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

