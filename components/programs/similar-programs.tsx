"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { GraduationCap, TrendingUp, ExternalLink, Loader2, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface SimilarProgram {
  id: string
  name: string
  institution: {
    id: string
    name: string
    type: string
    state: string
  }
  degreeType?: string
  cutoffHistory?: any[]
  accreditationStatus?: string
  similarity?: number
}

interface SimilarProgramsProps {
  programId: string
  programName: string
  degreeType?: string
  limit?: number
}

export function SimilarPrograms({
  programId,
  programName,
  degreeType,
  limit = 6,
}: SimilarProgramsProps) {
  const [similarPrograms, setSimilarPrograms] = useState<SimilarProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSimilarPrograms = async () => {
      try {
        setLoading(true)
        // Fetch programs with the same degree type
        const params = new URLSearchParams()
        if (degreeType) {
          params.set("degreeType", degreeType)
        }
        params.set("limit", (limit + 1).toString())

        const response = await fetch(`/api/programs?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch similar programs")
        const data = await response.json()

        // Filter out the current program and limit results
        const filtered = data.data
          .filter((p: SimilarProgram) => p.id !== programId)
          .slice(0, limit)

        setSimilarPrograms(filtered)
      } catch (error) {
        console.error("Error fetching similar programs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarPrograms()
  }, [programId, degreeType, limit])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Similar Programs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (similarPrograms.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Similar Programs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {similarPrograms.map((program) => {
            const latestCutoff = Array.isArray(program.cutoffHistory)
              ? program.cutoffHistory[0]
              : null

            return (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="block p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {program.name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-1">
                      <span className="font-medium">{program.institution.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {program.institution.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {program.institution.state}
                      </Badge>
                    </div>
                    {latestCutoff && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>
                          Cutoff: {typeof latestCutoff === "object" ? latestCutoff.cutoff : latestCutoff}
                        </span>
                      </div>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
        {degreeType && (
          <Link href={`/programs?degreeType=${degreeType}`}>
            <Button variant="outline" className="w-full mt-4" size="sm">
              View All {degreeType} Programs
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

