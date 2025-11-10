"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Building2, TrendingUp, MapPin, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface RecommendationCardProps {
  program: {
    id: string
    name: string
    accreditationStatus?: string | null
    accreditationMaturityDate?: number | null
    institution: {
      name: string
      state: string
      type: string
    }
    eligibility: {
      compositeScore: number
      probability: number
      category: "safe" | "target" | "reach"
      accreditationScore?: number
      accreditationWarning?: string | null
    }
    duration?: string
  }
  rank: number
}

export function RecommendationCard({ program, rank }: RecommendationCardProps) {
  const getCategoryVariant = (category: string) => {
    switch (category) {
      case "safe":
        return "default"
      case "target":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-primary">#{rank}</span>
              <CardTitle className="text-base sm:text-lg truncate">
                {program.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{program.institution.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span>{program.institution.state}</span>
              <span>•</span>
              <span>{program.institution.type}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <Badge
              variant={getCategoryVariant(program.eligibility.category)}
              className="mb-2"
            >
              {program.eligibility.category.toUpperCase()}
            </Badge>
            {program.accreditationStatus && (
              <Badge
                variant={
                  program.accreditationStatus === "Full"
                    ? "default"
                    : program.accreditationStatus === "Interim"
                    ? "secondary"
                    : "destructive"
                }
                className="mb-2 text-xs"
              >
                {program.accreditationStatus === "Full" ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : program.accreditationStatus === "Interim" ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {program.accreditationStatus}
              </Badge>
            )}
            <p className="text-2xl font-bold text-primary">
              {(program.eligibility.probability * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Admission Probability</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {program.eligibility.accreditationWarning && (
          <Alert variant={program.accreditationStatus === "Interim" ? "default" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {program.eligibility.accreditationWarning}
            </AlertDescription>
          </Alert>
        )}
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
          {program.accreditationMaturityDate && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Accredited until {program.accreditationMaturityDate}
              </span>
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
  )
}

