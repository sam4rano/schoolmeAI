"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface EligibilityResult {
  compositeScore: number
  probability?: number
  confidenceInterval?: [number, number]
  category: "safe" | "target" | "reach"
  rationale: string
}

interface WhatIfScenariosProps {
  baseResult: EligibilityResult
  baseUtme: number
  baseOlevels: Record<string, string>
  programId: string
  onCalculate: (utme: number, olevels: Record<string, string>) => Promise<EligibilityResult | null>
}

export function WhatIfScenarios({
  baseResult,
  baseUtme,
  baseOlevels,
  programId,
  onCalculate,
}: WhatIfScenariosProps) {
  const [scenarios, setScenarios] = useState<Array<{
    id: string
    name: string
    utme: number
    olevels: Record<string, string>
    result: EligibilityResult | null
    loading: boolean
  }>>([])
  const [showAddScenario, setShowAddScenario] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState("")
  const [newScenarioUtme, setNewScenarioUtme] = useState(baseUtme.toString())
  const [newScenarioOlevels, setNewScenarioOlevels] = useState<Record<string, string>>({ ...baseOlevels })

  const addScenario = async () => {
    if (!newScenarioName.trim() || !programId) return

    const scenarioId = Date.now().toString()
    const newScenario = {
      id: scenarioId,
      name: newScenarioName,
      utme: parseInt(newScenarioUtme) || baseUtme,
      olevels: { ...newScenarioOlevels },
      result: null,
      loading: true,
    }

    setScenarios([...scenarios, newScenario])
    setShowAddScenario(false)
    setNewScenarioName("")
    setNewScenarioUtme(baseUtme.toString())
    setNewScenarioOlevels({ ...baseOlevels })

    // Calculate result for the scenario
    try {
      const result = await onCalculate(newScenario.utme, newScenario.olevels)
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? { ...s, result, loading: false }
            : s
        )
      )
    } catch (error) {
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? { ...s, result: null, loading: false }
            : s
        )
      )
    }
  }

  const removeScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id))
  }

  const getProbabilityChange = (scenarioResult: EligibilityResult | null) => {
    if (!scenarioResult || baseResult.probability === undefined || scenarioResult.probability === undefined) {
      return null
    }
    const change = scenarioResult.probability - baseResult.probability
    return change
  }

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

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What If Scenarios
            </CardTitle>
            <CardDescription>
              Explore how different scores affect your admission probability
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddScenario(!showAddScenario)}
          >
            {showAddScenario ? "Cancel" : "Add Scenario"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddScenario && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Scenario Name
                </label>
                <Input
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g., Improved O-levels, Higher UTME"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  UTME Score
                </label>
                <Input
                  type="number"
                  min="0"
                  max="400"
                  value={newScenarioUtme}
                  onChange={(e) => setNewScenarioUtme(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  O-level Grades
                </label>
                <div className="space-y-2">
                  {Object.entries(newScenarioOlevels).map(([subject, grade]) => (
                    <div key={subject} className="flex items-center gap-2">
                      <span className="flex-1 text-sm">{subject}</span>
                      <Select
                        value={grade}
                        onValueChange={(value) =>
                          setNewScenarioOlevels({ ...newScenarioOlevels, [subject]: value })
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="A1">A1</SelectItem>
                          <SelectItem value="B2">B2</SelectItem>
                          <SelectItem value="B3">B3</SelectItem>
                          <SelectItem value="C4">C4</SelectItem>
                          <SelectItem value="C5">C5</SelectItem>
                          <SelectItem value="C6">C6</SelectItem>
                          <SelectItem value="D7">D7</SelectItem>
                          <SelectItem value="E8">E8</SelectItem>
                          <SelectItem value="F9">F9</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={addScenario} className="w-full" disabled={!newScenarioName.trim()}>
                Add Scenario
              </Button>
            </CardContent>
          </Card>
        )}

        {scenarios.length === 0 && !showAddScenario && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scenarios yet. Click &quot;Add Scenario&quot; to explore different score combinations.</p>
          </div>
        )}

        {scenarios.map((scenario) => {
          const probabilityChange = getProbabilityChange(scenario.result)
          return (
            <Card key={scenario.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{scenario.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScenario(scenario.id)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">UTME Score</p>
                    <p className="font-semibold">{scenario.utme}</p>
                    {scenario.utme !== baseUtme && (
                      <Badge variant="outline" className="mt-1">
                        {scenario.utme > baseUtme ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {scenario.utme > baseUtme ? "+" : ""}
                        {scenario.utme - baseUtme}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Composite Score</p>
                    <p className="font-semibold">
                      {scenario.result?.compositeScore.toFixed(1) || "—"}
                    </p>
                    {scenario.result && scenario.result.compositeScore !== baseResult.compositeScore && (
                      <Badge variant="outline" className="mt-1">
                        {scenario.result.compositeScore > baseResult.compositeScore ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {scenario.result.compositeScore > baseResult.compositeScore ? "+" : ""}
                        {(scenario.result.compositeScore - baseResult.compositeScore).toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>

                {scenario.loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Calculating...
                  </div>
                ) : scenario.result ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Probability</p>
                        <p className="text-xl font-bold">
                          {scenario.result.probability !== undefined
                            ? `${(scenario.result.probability * 100).toFixed(0)}%`
                            : "—"}
                        </p>
                        {probabilityChange !== null && probabilityChange !== 0 && (
                          <Badge
                            variant={probabilityChange > 0 ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {probabilityChange > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {probabilityChange > 0 ? "+" : ""}
                            {(probabilityChange * 100).toFixed(1)}%
                          </Badge>
                        )}
                        {probabilityChange === 0 && (
                          <Badge variant="outline" className="mt-1">
                            <Minus className="h-3 w-3 mr-1" />
                            No change
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <Badge className={getCategoryColor(scenario.result.category)}>
                          {scenario.result.category.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{scenario.result.rationale}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-destructive text-sm">
                    Failed to calculate. Please try again.
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}

