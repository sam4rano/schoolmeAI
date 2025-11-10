"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentLayout } from "@/components/student/student-layout"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { BookOpen, Calculator, Sparkles, TrendingUp, Loader2, ExternalLink } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface WatchlistItem {
  id: string
  programId: string
  priority: string | null
  createdAt: string
  program: {
    id: string
    name: string
    institution: {
      id: string
      name: string
      type: string
      ownership: string
      state: string
    }
  }
}

interface CalculationHistory {
  id: string
  timestamp: number
  utme: number
  olevels: Record<string, string>
  programId: string
  programName: string
  institutionName: string
  result: {
    compositeScore: number
    probability: number
    category: string
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([])

  // Fetch watchlist
  const { data: watchlistData, isLoading: watchlistLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const response = await fetch("/api/watchlist")
      if (!response.ok) throw new Error("Failed to fetch watchlist")
      return response.json()
    },
    enabled: !!session?.user,
  })

  const watchlistItems: WatchlistItem[] = watchlistData?.data || []

  // Load calculation history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("calculationHistory")
      if (stored) {
        try {
          const history = JSON.parse(stored)
          setCalculationHistory(Array.isArray(history) ? history.slice(0, 5) : [])
        } catch (error) {
          console.error("Error parsing calculation history:", error)
        }
      }
    }
  }, [])

  return (
    <StudentLayout>
      <div className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.email || "Student"}! Your personalized admission journey overview
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>My Watchlist</CardTitle>
                </div>
                {watchlistItems.length > 0 && (
                  <Badge variant="secondary">{watchlistItems.length}</Badge>
                )}
              </div>
              <CardDescription>Programs you&apos;re tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {watchlistLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : watchlistItems.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    No programs in your watchlist yet
                  </p>
                  <Link href="/programs">
                    <Button variant="outline" size="sm" className="w-full">
                      Browse Programs
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="space-y-3">
                  {watchlistItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.program.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.program.institution.name}
                          </p>
                        </div>
                        {item.priority && (
                          <Badge variant={item.priority === "high" ? "destructive" : item.priority === "medium" ? "default" : "secondary"} className="ml-2 text-xs">
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {watchlistItems.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{watchlistItems.length - 3} more
                    </p>
                  )}
                  <Link href="/watchlist">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Watchlist
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <CardTitle>Recent Calculations</CardTitle>
                </div>
                {calculationHistory.length > 0 && (
                  <Badge variant="secondary">{calculationHistory.length}</Badge>
                )}
              </div>
              <CardDescription>Your eligibility calculations</CardDescription>
            </CardHeader>
            <CardContent>
              {calculationHistory.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    No calculations yet
                  </p>
                  <Link href="/calculator">
                    <Button variant="outline" size="sm" className="w-full">
                      Calculate Eligibility
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="space-y-3">
                  {calculationHistory.map((calc) => (
                    <div key={calc.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{calc.programName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {calc.institutionName}
                          </p>
                        </div>
                        <Badge variant={calc.result.category === "high" ? "default" : calc.result.category === "medium" ? "secondary" : "outline"} className="ml-2 text-xs">
                          {Math.round(calc.result.probability * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>UTME: {calc.utme}</span>
                        <span>Score: {Math.round(calc.result.compositeScore)}</span>
                      </div>
                    </div>
                  ))}
                  <Link href="/calculator">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Calculations
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Recommendations</CardTitle>
              </div>
              <CardDescription>Get personalized program recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get AI-powered recommendations based on your scores
              </p>
              <Link href="/recommendations">
                <Button variant="outline" size="sm" className="w-full">
                  Get Recommendations
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>My Profile</CardTitle>
              </div>
              <CardDescription>Account information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your account settings
              </p>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  )
}


