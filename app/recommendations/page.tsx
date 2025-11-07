"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { useRecommendations } from "@/lib/hooks/use-recommendations"
import { GraduationCap, Building2, TrendingUp, Sparkles, Loader2, Calculator } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function RecommendationsPage() {
  const [utme, setUtme] = useState("")
  const [olevels, setOlevels] = useState({
    maths: "",
    english: "",
    biology: "",
    chemistry: "",
    physics: "",
  })
  const [showResults, setShowResults] = useState(false)

  const { data, isLoading, error } = useRecommendations(
    showResults && utme
      ? {
          utme: parseInt(utme),
          olevels: Object.fromEntries(
            Object.entries(olevels).filter(([_, value]) => value !== "")
          ),
          limit: 20,
        }
      : undefined
  )

  const handleGetRecommendations = () => {
    if (utme && Object.values(olevels).some((v) => v)) {
      setShowResults(true)
    }
  }

  const programs = data?.data || []
  const meta = data?.meta

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Program Recommendations
          </h1>
          <p className="text-muted-foreground">
            Get personalized program recommendations based on your JAMB and O-level scores
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Your Scores</CardTitle>
            <CardDescription>
              Fill in your UTME score and O-level grades to get recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                UTME Score (0-400)
              </label>
              <Input
                type="number"
                min="0"
                max="400"
                value={utme}
                onChange={(e) => setUtme(e.target.value)}
                placeholder="Enter your UTME score"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                O-level Grades
              </label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(olevels).map(([subject, grade]) => (
                  <div key={subject}>
                    <label className="block text-xs text-muted-foreground mb-1 capitalize">
                      {subject}
                    </label>
                    <Input
                      type="text"
                      placeholder="A1, B2, C4..."
                      value={grade}
                      onChange={(e) =>
                        setOlevels({ ...olevels, [subject]: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGetRecommendations}
              disabled={!utme || !Object.values(olevels).some((v) => v)}
              className="w-full"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Get Recommendations
            </Button>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
            </CardContent>
          </Card>
        )}

        {showResults && !isLoading && !error && (
          <>
            {meta && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Composite Score</p>
                      <p className="text-2xl font-bold text-primary">{meta.compositeScore.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Programs Analyzed</p>
                      <p className="text-2xl font-bold">{meta.totalPrograms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recommendations</p>
                      <p className="text-2xl font-bold text-green-600">{meta.recommended}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {programs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No suitable programs found. Try adjusting your scores or check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Recommended Programs</h2>
                  <Badge variant="secondary">{programs.length} programs</Badge>
                </div>

                {programs.map((program) => (
                  <Card key={program.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2">{program.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 flex-wrap">
                            <Building2 className="h-4 w-4" />
                            <span>{program.institution.name}</span>
                            <Badge variant="outline">{program.institution.type}</Badge>
                            <Badge variant="secondary">{program.institution.state}</Badge>
                            {program.degreeType && (
                              <Badge variant="outline">{program.degreeType}</Badge>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              program.eligibility.category === "safe"
                                ? "default"
                                : program.eligibility.category === "target"
                                ? "secondary"
                                : "outline"
                            }
                            className="mb-2"
                          >
                            {program.eligibility.category.toUpperCase()}
                          </Badge>
                          <p className="text-2xl font-bold text-primary">
                            {(program.eligibility.probability * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Admission Probability</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Composite Score: {program.eligibility.compositeScore.toFixed(1)}
                          </span>
                        </div>
                        {program.duration && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{program.duration}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/programs/${program.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/calculator?programId=${program.id}`} className="flex-1">
                          <Button variant="default" className="w-full">
                            Calculate Eligibility
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

