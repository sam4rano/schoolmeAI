"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EligibilityResult {
  compositeScore: number
  probability?: number
  confidenceInterval?: [number, number]
  category: "safe" | "target" | "reach"
  rationale: string
  dataQuality: {
    cutoffConfidence: "verified" | "estimated" | "unverified"
    historicalDataYears?: number
    lastUpdated?: string
  }
}

interface CalculatorResultsProps {
  result: EligibilityResult | null
}

export function CalculatorResults({ result }: CalculatorResultsProps) {
  if (!result) return null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-200"
      case "target":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reach":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "estimated":
        return "bg-yellow-100 text-yellow-800"
      case "unverified":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Composite Score</p>
            <p className="text-2xl font-bold">{result.compositeScore}</p>
          </div>

          {result.probability !== undefined && (
            <div>
              <p className="text-sm text-muted-foreground">
                Admission Probability
              </p>
              <p className="text-2xl font-bold">
                {(result.probability * 100).toFixed(0)}%
              </p>
              {result.confidenceInterval && (
                <p className="text-xs text-muted-foreground">
                  Confidence:{" "}
                  {(result.confidenceInterval[0] * 100).toFixed(0)}% -{" "}
                  {(result.confidenceInterval[1] * 100).toFixed(0)}%
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <Badge className={getCategoryColor(result.category)}>
              {result.category.toUpperCase()}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Rationale</p>
            <p className="text-sm">{result.rationale}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Data Quality</p>
            <div className="flex items-center gap-2">
              <Badge className={getConfidenceColor(result.dataQuality.cutoffConfidence)}>
                {result.dataQuality.cutoffConfidence}
              </Badge>
              {result.dataQuality.historicalDataYears && (
                <span className="text-xs text-muted-foreground">
                  • {result.dataQuality.historicalDataYears} years of data
                </span>
              )}
              {result.dataQuality.lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  • Updated {new Date(result.dataQuality.lastUpdated).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

