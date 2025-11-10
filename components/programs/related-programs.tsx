"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { GraduationCap, TrendingUp, ExternalLink, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface RelatedProgram {
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
}

interface RelatedProgramsProps {
  programId: string
  programName: string
  institutionId: string
  degreeType?: string
  limit?: number
}

export function RelatedPrograms({
  programId,
  programName,
  institutionId,
  degreeType,
  limit = 6,
}: RelatedProgramsProps) {
  const [relatedPrograms, setRelatedPrograms] = useState<RelatedProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedPrograms = async () => {
      try {
        setLoading(true)
        // Fetch programs from the same institution
        const response = await fetch(
          `/api/programs?institution_id=${institutionId}&limit=${limit + 1}`
        )
        if (!response.ok) throw new Error("Failed to fetch related programs")
        const data = await response.json()
        
        // Filter out the current program and limit results
        const filtered = data.data
          .filter((p: RelatedProgram) => p.id !== programId)
          .slice(0, limit)
        
        setRelatedPrograms(filtered)
      } catch (error) {
        console.error("Error fetching related programs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedPrograms()
  }, [programId, institutionId, limit])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Related Programs</CardTitle>
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

  if (relatedPrograms.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Other Programs at {relatedPrograms[0]?.institution.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relatedPrograms.map((program) => {
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
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      {program.degreeType && (
                        <Badge variant="outline" className="text-xs">
                          {program.degreeType}
                        </Badge>
                      )}
                      {program.accreditationStatus && (
                        <Badge
                          variant={
                            program.accreditationStatus === "Full"
                              ? "default"
                              : program.accreditationStatus === "Interim"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {program.accreditationStatus}
                        </Badge>
                      )}
                    </div>
                    {latestCutoff && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
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
        <Link href={`/programs?institution_id=${institutionId}`}>
          <Button variant="outline" className="w-full mt-4" size="sm">
            View All Programs
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

