"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, GitCompare } from "lucide-react"

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

interface CalculationHistory {
  id: string
  timestamp: number
  utme: number
  olevels: Record<string, string>
  programId: string
  programName: string
  institutionName: string
  result: EligibilityResult
}

interface CalculatorComparisonProps {
  showComparison: boolean
  onClose: () => void
  comparedCalculations: CalculationHistory[]
  onRemoveFromComparison: (id: string) => void
}

export function CalculatorComparison({
  showComparison,
  onClose,
  comparedCalculations,
  onRemoveFromComparison,
}: CalculatorComparisonProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safe":
        return "bg-green-100 text-green-800"
      case "target":
        return "bg-blue-100 text-blue-800"
      case "reach":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (comparedCalculations.length === 0) return null

  return (
    <Dialog open={showComparison} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Calculations
          </DialogTitle>
          <DialogDescription>
            Compare {comparedCalculations.length} calculation{comparedCalculations.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparedCalculations.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{entry.programName}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {entry.institutionName}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFromComparison(entry.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">UTME Score</p>
                      <p className="font-semibold">{entry.utme}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Composite Score</p>
                      <p className="font-semibold">{entry.result.compositeScore.toFixed(1)}</p>
                    </div>
                    {entry.result.probability !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Probability</p>
                        <p className="font-semibold">
                          {(entry.result.probability * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <Badge className={getCategoryColor(entry.result.category)}>
                        {entry.result.category}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Rationale</p>
                    <p className="text-xs">{entry.result.rationale}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data Quality</p>
                    <Badge variant="outline" className="text-xs">
                      {entry.result.dataQuality.cutoffConfidence}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

