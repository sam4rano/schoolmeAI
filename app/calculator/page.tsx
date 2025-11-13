"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { usePrograms } from "@/lib/hooks/use-programs"
import { useSession } from "next-auth/react"
import { Search, GraduationCap, Building2, X, Trash2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalculatorForm } from "@/components/calculator/calculator-form"
import { CalculatorResults } from "@/components/calculator/calculator-results"
import { CalculatorHistory } from "@/components/calculator/calculator-history"
import { CalculatorComparison } from "@/components/calculator/calculator-comparison"
import { WhatIfScenarios } from "@/components/calculator/what-if-scenarios"
import { useToast } from "@/hooks/use-toast"
import { analytics } from "@/lib/analytics/tracker"

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

const COMMON_OLEVEL_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Geography",
  "History",
  "Commerce",
  "Accounting",
  "Agricultural Science",
  "Christian Religious Studies (CRS)",
  "Islamic Religious Studies (IRS)",
  "Further Mathematics",
  "Technical Drawing",
  "Food and Nutrition",
  "Home Economics",
  "French",
  "Yoruba",
  "Igbo",
  "Hausa",
]

export default function CalculatorPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [utme, setUtme] = useState("")
  const [olevels, setOlevels] = useState<Record<string, string>>({
    "English Language": "none",
  })
  const availableSubjects = COMMON_OLEVEL_SUBJECTS.filter((s) => s !== "English Language")
  const [programId, setProgramId] = useState("")
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [programSearch, setProgramSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<CalculationHistory[]>([])
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const programDropdownRef = useRef<HTMLDivElement>(null)

  // Sync localStorage calculations to database
  const syncLocalToDatabase = useCallback(async (localData: CalculationHistory[]) => {
    if (!session?.user || localData.length === 0) return

    setSyncing(true)
    try {
      const response = await fetch("/api/calculations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calculations: localData }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data.synced > 0) {
          toast({
            title: "History synced",
            description: `Synced ${data.data.synced} calculation(s) to your account`,
          })
          // Clear localStorage after successful sync
          localStorage.removeItem("calculator-history")
        }
      }
    } catch (error) {
      console.error("Failed to sync calculations", error)
    } finally {
      setSyncing(false)
    }
  }, [session?.user, toast])

  // Load history from database for signed-in users, or localStorage for guests
  useEffect(() => {
    const loadHistory = async () => {
      if (session?.user) {
        // Load from database
        try {
          const response = await fetch("/api/calculations")
          if (response.ok) {
            const data = await response.json()
            const dbHistory: CalculationHistory[] = (data.data || []).map((calc: any) => ({
              id: calc.id,
              timestamp: new Date(calc.createdAt).getTime(),
              utme: calc.utme,
              olevels: calc.olevels as Record<string, string>,
              programId: calc.programId,
              programName: calc.program.name,
              institutionName: calc.program.institution.name,
              result: {
                compositeScore: calc.compositeScore,
                probability: calc.probability || undefined,
                category: calc.category as "safe" | "target" | "reach",
                rationale: calc.rationale || "",
                dataQuality: {
                  cutoffConfidence: "verified" as const,
                },
              },
            }))
            setHistory(dbHistory)

            // Sync localStorage with database
            const localHistory = localStorage.getItem("calculator-history")
            if (localHistory) {
              try {
                const localData = JSON.parse(localHistory)
                if (localData.length > 0) {
                  // Sync local data to database
                  await syncLocalToDatabase(localData)
                }
              } catch (e) {
                console.error("Failed to parse local history", e)
              }
            }
          }
        } catch (error) {
          console.error("Failed to load calculation history from database", error)
          // Fallback to localStorage
          loadFromLocalStorage()
        }
      } else {
        // Load from localStorage for guests
        loadFromLocalStorage()
      }
    }

    const loadFromLocalStorage = () => {
      const savedHistory = localStorage.getItem("calculator-history")
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory))
        } catch (e) {
          console.error("Failed to load calculation history", e)
        }
      }
    }

    loadHistory()
  }, [session, syncLocalToDatabase])

  // Save history to localStorage for guests, or database for signed-in users
  useEffect(() => {
    if (history.length > 0) {
      if (session?.user) {
        // For signed-in users, history is managed by the database
        // We still keep a local copy for offline access
        const recentHistory = history.slice(0, 50)
        localStorage.setItem("calculator-history", JSON.stringify(recentHistory))
      } else {
        // For guests, save to localStorage only
        const recentHistory = history.slice(0, 50)
        localStorage.setItem("calculator-history", JSON.stringify(recentHistory))
      }
    }
  }, [history, session])

  // Debounce program search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(programSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [programSearch])

  // Fetch programs based on search
  const { data: programsData, isLoading: programsLoading } = usePrograms({
    query: debouncedSearch || undefined,
    limit: 10,
  })

  const programs = programsData?.data || []

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        programDropdownRef.current &&
        !programDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProgramDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectProgram = (program: any) => {
    setSelectedProgram(program)
    setProgramId(program.id)
    setProgramSearch(`${program.name} - ${program.institution?.name}`)
    setShowProgramDropdown(false)
  }

  const handleClearProgram = () => {
    setSelectedProgram(null)
    setProgramId("")
    setProgramSearch("")
  }

  // Check for programId in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlProgramId = params.get("programId")
    if (urlProgramId) {
      // Fetch program details and set it
      fetch(`/api/programs/${urlProgramId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            handleSelectProgram(data.data)
          }
        })
        .catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const calculateEligibility = async (utmeScore: number, olevelGrades: Record<string, string>): Promise<EligibilityResult | null> => {
    try {
      const response = await fetch("/api/calculate/eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          utme: utmeScore,
          olevels: Object.fromEntries(
            Object.entries(olevelGrades).filter(([_, value]) => value !== "" && value !== "none")
          ),
          programId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to calculate eligibility")
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      console.error("Error calculating eligibility:", err)
      return null
    }
  }

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const calculationResult = await calculateEligibility(parseInt(utme), olevels)
      
      if (!calculationResult) {
        throw new Error("Failed to calculate eligibility")
      }

      setResult(calculationResult)

      // Track calculation event
      analytics.track("calculation_performed", {
        programId,
        programName: selectedProgram?.name,
        utme: parseInt(utme),
        category: calculationResult.category,
        probability: calculationResult.probability,
      })
      analytics.trackConversion("calculation", undefined, {
        programId,
        category: calculationResult.category,
      })

      // Save to history
      if (selectedProgram) {
        const historyEntry: CalculationHistory = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          utme: parseInt(utme),
          olevels: Object.fromEntries(
            Object.entries(olevels).filter(([_, value]) => value !== "" && value !== "none")
          ),
          programId,
          programName: selectedProgram.name,
          institutionName: selectedProgram.institution?.name || "Unknown",
          result: calculationResult,
        }
        setHistory((prev) => [historyEntry, ...prev])

        // Save to database for signed-in users
        if (session?.user) {
          try {
            const response = await fetch("/api/calculations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                programId,
                utme: parseInt(utme),
                olevels: historyEntry.olevels,
                compositeScore: calculationResult.compositeScore,
                probability: calculationResult.probability,
                category: calculationResult.category,
                rationale: calculationResult.rationale,
                result: calculationResult,
              }),
            })

            if (response.ok) {
              const data = await response.json()
              // Update the history entry with the database ID
              setHistory((prev) =>
                prev.map((item) =>
                  item.id === historyEntry.id ? { ...item, id: data.data.id } : item
                )
              )
            }
          } catch (error) {
            console.error("Failed to save calculation to database", error)
            // Continue with localStorage only
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (entry: CalculationHistory) => {
    setUtme(entry.utme.toString())
    setOlevels(entry.olevels)
    setProgramId(entry.programId)
    setResult(entry.result)
    setShowHistory(false)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("calculator-history")
  }

  const toggleComparison = (id: string) => {
    setSelectedForComparison((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const comparedCalculations = history.filter((entry) => selectedForComparison.has(entry.id))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-2xl">
             <div className="mb-6 sm:mb-8">
               <div className="flex items-center justify-between mb-3 sm:mb-4">
                 <div>
                   <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Eligibility Calculator</h1>
                   <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                     Calculate your admission probability based on JAMB and O-level scores
                   </p>
                 </div>
                 <div className="flex gap-2">
                   <CalculatorHistory
                     history={history}
                     selectedForComparison={selectedForComparison}
                     onLoadFromHistory={loadFromHistory}
                     onClearHistory={clearHistory}
                     onToggleComparison={toggleComparison}
                     onShowComparison={() => setShowComparison(true)}
                   />
                 </div>
               </div>
             </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Your Scores</CardTitle>
          <CardDescription>
            Fill in your UTME score and O-level grades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${utme ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                1
              </div>
              <span className="text-sm font-medium">Scores</span>
            </div>
            <div className="flex-1 h-px bg-muted mx-2" />
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${programId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                2
              </div>
              <span className="text-sm font-medium">Program</span>
            </div>
            <div className="flex-1 h-px bg-muted mx-2" />
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${result ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                3
              </div>
              <span className="text-sm font-medium">Result</span>
            </div>
          </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                O-level Grades
              </label>
              {availableSubjects.filter((s) => !olevels[s]).length > 0 && (
                <Select
                  onValueChange={(value) => {
                    if (value && !olevels[value]) {
                      setOlevels({ ...olevels, [value]: "none" })
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects
                      .filter((s) => !olevels[s])
                      .map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                     {Object.entries(olevels).map(([subject, grade]) => (
                       <div key={subject} className="flex gap-2">
                         <div className="flex-1">
                           <label className="block text-xs text-muted-foreground mb-1">
                             {subject}
                           </label>
                    <Select
                      value={grade}
                      onValueChange={(value) =>
                        setOlevels({ ...olevels, [subject]: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
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
                  {subject !== "English Language" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => {
                        const newOlevels = { ...olevels }
                        delete newOlevels[subject]
                        setOlevels(newOlevels)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Add subjects you have grades for. English Language is required.
            </p>
          </div>

          <div className="relative" ref={programDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Select Program <span className="text-destructive">*</span>
              </label>
              {selectedProgram && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={programSearch}
                onChange={(e) => {
                  setProgramSearch(e.target.value)
                  setShowProgramDropdown(true)
                  if (!e.target.value) {
                    handleClearProgram()
                  }
                }}
                onFocus={() => setShowProgramDropdown(true)}
                placeholder="Search for a program (e.g., Computer Science, Medicine, Law...)"
                className="pl-10 pr-10"
              />
              {selectedProgram && (
                <button
                  onClick={handleClearProgram}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

                   {showProgramDropdown && programSearch && (
                     <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto left-0 right-0">
                {programsLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : programs.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No programs found. Try a different search term.
                  </div>
                ) : (
                  <div className="p-1">
                    {programs.map((program: any) => (
                      <button
                        key={program.id}
                        onClick={() => handleSelectProgram(program)}
                        className="w-full text-left p-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <GraduationCap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{program.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground truncate">
                                {program.institution?.name}
                              </p>
                            </div>
                            {program.degreeType && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {program.degreeType}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedProgram && (
              <div className="mt-3 p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-sm">{selectedProgram.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{selectedProgram.institution?.name}</span>
                      <span>•</span>
                      <span>{selectedProgram.institution?.state}</span>
                    </div>
                    {selectedProgram.faculty && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Faculty: {selectedProgram.faculty}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/programs/${selectedProgram.id}`}
                    className="text-xs text-primary hover:underline flex-shrink-0 ml-2"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleCalculate}
            disabled={loading || !utme || !programId}
            className="w-full"
          >
            {loading ? "Calculating..." : "Calculate Eligibility"}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

        </CardContent>
      </Card>

      <CalculatorResults result={result} />

      {result && (
        <WhatIfScenarios
          baseResult={result}
          baseUtme={parseInt(utme) || 0}
          baseOlevels={olevels}
          programId={programId}
          onCalculate={calculateEligibility}
        />
      )}

      <CalculatorComparison
        showComparison={showComparison}
        onClose={() => setShowComparison(false)}
        comparedCalculations={comparedCalculations}
        onRemoveFromComparison={toggleComparison}
      />
      </main>
      <Footer />
    </div>
  )
}

