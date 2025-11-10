"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, TrendingUp, Award, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface InstitutionStatisticsProps {
  institutionId: string
}

interface Statistics {
  totalPrograms: number
  accreditedPrograms: number
  averageCutoff: number
  programTypes: Record<string, number>
}

export function InstitutionStatistics({ institutionId }: InstitutionStatisticsProps) {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/institutions/${institutionId}/statistics`)
        if (!response.ok) throw new Error("Failed to fetch statistics")
        const data = await response.json()
        setStats(data.data)
      } catch (error) {
        console.error("Error fetching statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [institutionId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistics</CardTitle>
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

  if (!stats) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Institution Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Programs</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalPrograms}</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Accredited</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.accreditedPrograms}</p>
          </div>

          {stats.averageCutoff > 0 && (
            <div className="p-3 bg-muted/50 rounded-md col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Average Cutoff</span>
              </div>
              <p className="text-2xl font-bold">{stats.averageCutoff.toFixed(1)}</p>
            </div>
          )}

          {Object.keys(stats.programTypes).length > 0 && (
            <div className="col-span-2 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Program Types</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.programTypes).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}: {count}
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

