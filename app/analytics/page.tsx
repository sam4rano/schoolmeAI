import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, GraduationCap, TrendingUp, Download, BarChart3 } from "lucide-react"

async function getAnalytics() {
  try {
    const [institutionsRes, programsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/institutions`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/programs`, {
        cache: "no-store",
      }),
    ])

    const institutions = institutionsRes.ok ? await institutionsRes.json() : { data: [], pagination: { total: 0 } }
    const programs = programsRes.ok ? await programsRes.json() : { data: [], pagination: { total: 0 } }

    return {
      institutions: institutions.pagination?.total || 0,
      programs: programs.pagination?.total || 0,
      institutionsData: institutions.data || [],
      programsData: programs.data || [],
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return {
      institutions: 0,
      programs: 0,
      institutionsData: [],
      programsData: [],
    }
  }
}

function TrendChart({ data, title }: { data: any[]; title: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No historical data available</p>
      </div>
    )
  }

  // Simple bar chart representation
  const maxValue = Math.max(...data.map((d) => d.cutoff || 0))
  const minValue = Math.min(...data.map((d) => d.cutoff || 0))

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((item, index) => {
          const height = maxValue > 0 ? ((item.cutoff - minValue) / (maxValue - minValue)) * 100 : 50
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                style={{ height: `${Math.max(height, 10)}%` }}
                title={`${item.year}: ${item.cutoff}`}
              />
              <span className="text-xs text-muted-foreground mt-1">{item.year}</span>
            </div>
          )
        })}
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Range: {minValue} - {maxValue}
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  const { institutions, programs, institutionsData, programsData } = await getAnalytics()

  // Calculate statistics
  const institutionsByType = institutionsData.reduce((acc: any, inst: any) => {
    acc[inst.type] = (acc[inst.type] || 0) + 1
    return acc
  }, {})

  const institutionsByOwnership = institutionsData.reduce((acc: any, inst: any) => {
    acc[inst.ownership] = (acc[inst.ownership] || 0) + 1
    return acc
  }, {})

  // Get programs with cutoff history
  const programsWithHistory = programsData.filter((p: any) => {
    const history = Array.isArray(p.cutoffHistory) ? p.cutoffHistory : []
    return history.length > 0
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Historical Analytics</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Trends and insights from admission cutoff data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Institutions</CardTitle>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>Registered institutions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{institutions}</p>
              <p className="text-xs text-muted-foreground mt-2">Across all types</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Programs</CardTitle>
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>Available programs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{programs}</p>
              <p className="text-xs text-muted-foreground mt-2">Across all institutions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Programs with History</CardTitle>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>Programs with cutoff data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{programsWithHistory.length}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {programs > 0
                  ? `${Math.round((programsWithHistory.length / programs) * 100)}% coverage`
                  : "No data"}
              </p>
            </CardContent>
          </Card>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Institutions by Type
            </CardTitle>
            <CardDescription>Distribution across institution types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(institutionsByType).length > 0 ? (
                Object.entries(institutionsByType)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([type, count]) => {
                    const percentage = institutions > 0 ? ((count as number) / institutions) * 100 : 0
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="capitalize font-medium">{type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                            <span className="font-semibold text-lg">{count as number}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
              ) : (
                <p className="text-center py-4 text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Institutions by Ownership
            </CardTitle>
            <CardDescription>Distribution across ownership types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(institutionsByOwnership).length > 0 ? (
                Object.entries(institutionsByOwnership)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([ownership, count]) => {
                    const percentage = institutions > 0 ? ((count as number) / institutions) * 100 : 0
                    return (
                      <div key={ownership} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="capitalize font-medium">{ownership}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                            <span className="font-semibold text-lg">{count as number}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
              ) : (
                <p className="text-center py-4 text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {programsWithHistory.length > 0 && (
        <Card className="mb-8 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cutoff Trends
            </CardTitle>
            <CardDescription>Historical cutoff data for top programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {programsWithHistory.slice(0, 5).map((program: any) => {
                const history = Array.isArray(program.cutoffHistory)
                  ? program.cutoffHistory
                      .filter((h: any) => h.year && h.cutoff)
                      .sort((a: any, b: any) => a.year - b.year)
                  : []

                if (history.length === 0) return null

                const latestCutoff = history[history.length - 1]?.cutoff
                const previousCutoff = history.length > 1 ? history[history.length - 2]?.cutoff : null
                const trend = previousCutoff
                  ? latestCutoff > previousCutoff
                    ? "increasing"
                    : latestCutoff < previousCutoff
                    ? "decreasing"
                    : "stable"
                  : null

                return (
                  <div key={program.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{program.name}</h3>
                          {trend && (
                            <Badge
                              variant={
                                trend === "increasing"
                                  ? "destructive"
                                  : trend === "decreasing"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {trend === "increasing" ? "↑" : trend === "decreasing" ? "↓" : "→"} {trend}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {program.institution?.name}
                        </p>
                        {latestCutoff && (
                          <p className="text-xs text-muted-foreground">
                            Latest cutoff: <span className="font-semibold">{latestCutoff}</span> ({history[history.length - 1]?.year})
                          </p>
                        )}
                      </div>
                      <Link href={`/programs/${program.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                    <TrendChart data={history} title={program.name} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>Download datasets for research and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/api/export/institutions?format=json">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Institutions (JSON)
              </Button>
            </Link>
            <Link href="/api/export/programs?format=csv">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Programs (CSV)
              </Button>
            </Link>
            <Link href="/api/export/institutions?format=csv">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Institutions (CSV)
              </Button>
            </Link>
            <Link href="/api/export/programs?format=json">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Programs (JSON)
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
        </main>
      <Footer />
    </div>
  )
}

