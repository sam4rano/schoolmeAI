"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { History, Trash2, GitCompare, Clock } from "lucide-react"
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

interface CalculatorHistoryProps {
  history: CalculationHistory[]
  selectedForComparison: Set<string>
  onLoadFromHistory: (entry: CalculationHistory) => void
  onClearHistory: () => void
  onToggleComparison: (id: string) => void
  onShowComparison: () => void
}

export function CalculatorHistory({
  history,
  selectedForComparison,
  onLoadFromHistory,
  onClearHistory,
  onToggleComparison,
  onShowComparison,
}: CalculatorHistoryProps) {
  const [showHistory, setShowHistory] = useState(false)

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

  return (
    <Dialog open={showHistory} onOpenChange={setShowHistory}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <History className="h-4 w-4 mr-2" />
          History ({history.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculation History</DialogTitle>
          <DialogDescription>
            View and manage your previous calculations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No calculation history yet
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {history.length} calculation{history.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  {selectedForComparison.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowComparison}
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      Compare ({selectedForComparison.size})
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onClearHistory}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {history.map((entry) => (
                  <Card key={entry.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => onLoadFromHistory(entry)}>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-sm">{entry.programName}</p>
                            <Badge className={getCategoryColor(entry.result.category)}>
                              {entry.result.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {entry.institutionName}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>UTME: {entry.utme}</span>
                            <span>Score: {entry.result.compositeScore.toFixed(1)}</span>
                            {entry.result.probability !== undefined && (
                              <span>
                                {(entry.result.probability * 100).toFixed(0)}% chance
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={selectedForComparison.has(entry.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => onToggleComparison(entry.id)}
                          className="ml-2"
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

