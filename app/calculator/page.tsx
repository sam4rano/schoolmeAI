"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { usePrograms } from "@/lib/hooks/use-programs"
import { Search, GraduationCap, Building2, X, Trash2, History, GitCompare, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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
  const programDropdownRef = useRef<HTMLDivElement>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("calculator-history")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Failed to load calculation history", e)
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      // Keep only last 50 calculations
      const recentHistory = history.slice(0, 50)
      localStorage.setItem("calculator-history", JSON.stringify(recentHistory))
    }
  }, [history])

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

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/calculate/eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
            utme: parseInt(utme),
            olevels: Object.fromEntries(
              Object.entries(olevels).filter(([_, value]) => value !== "" && value !== "none")
            ),
            programId,
          }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to calculate eligibility")
      }

      const data = await response.json()
      const calculationResult = data.data
      setResult(calculationResult)

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
                   <Dialog open={showHistory} onOpenChange={setShowHistory}>
                     <DialogTrigger asChild>
                       <Button variant="outline" size="sm">
                         <History className="h-4 w-4 mr-2" />
                         History ({history.length})
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                       <DialogHeader>
                         <DialogTitle>Calculation History</DialogTitle>
                         <DialogDescription>
                           View and reload your previous calculations
                         </DialogDescription>
                       </DialogHeader>
                       {history.length === 0 ? (
                         <div className="text-center py-8 text-muted-foreground">
                           No calculation history yet
                         </div>
                       ) : (
                         <div className="space-y-2">
                           <div className="flex justify-end">
                             <Button variant="outline" size="sm" onClick={clearHistory}>
                               Clear History
                             </Button>
                           </div>
                           {history.map((entry) => (
                             <Card key={entry.id} className="p-4">
                               <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-2">
                                     <Badge variant="outline">{entry.programName}</Badge>
                                     <span className="text-xs text-muted-foreground">
                                       {entry.institutionName}
                                     </span>
                                   </div>
                                   <div className="flex items-center gap-4 text-sm">
                                     <span>UTME: {entry.utme}</span>
                                     <span>Score: {entry.result.compositeScore.toFixed(1)}</span>
                                     {entry.result.probability && (
                                       <span>{(entry.result.probability * 100).toFixed(0)}%</span>
                                     )}
                                     <Badge variant={entry.result.category === "safe" ? "default" : entry.result.category === "target" ? "secondary" : "destructive"}>
                                       {entry.result.category}
                                     </Badge>
                                   </div>
                                   <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                     <Clock className="h-3 w-3" />
                                     {new Date(entry.timestamp).toLocaleString()}
                                   </div>
                                 </div>
                                 <div className="flex gap-2">
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => loadFromHistory(entry)}
                                   >
                                     Load
                                   </Button>
                                   <Button
                                     variant={selectedForComparison.has(entry.id) ? "default" : "outline"}
                                     size="sm"
                                     onClick={() => toggleComparison(entry.id)}
                                   >
                                     <GitCompare className="h-3 w-3" />
                                   </Button>
                                 </div>
                               </div>
                             </Card>
                           ))}
                         </div>
                       )}
                     </DialogContent>
                   </Dialog>
                   {comparedCalculations.length > 0 && (
                     <Dialog open={showComparison} onOpenChange={setShowComparison}>
                       <DialogTrigger asChild>
                         <Button variant="outline" size="sm">
                           <GitCompare className="h-4 w-4 mr-2" />
                           Compare ({comparedCalculations.length})
                         </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                         <DialogHeader>
                           <DialogTitle>Compare Calculations</DialogTitle>
                           <DialogDescription>
                             Compare multiple program calculations side by side
                           </DialogDescription>
                         </DialogHeader>
                         <div className="grid gap-4 md:grid-cols-2">
                           {comparedCalculations.map((entry) => (
                             <Card key={entry.id} className="p-4">
                               <div className="space-y-2">
                                 <div>
                                   <h4 className="font-semibold">{entry.programName}</h4>
                                   <p className="text-xs text-muted-foreground">{entry.institutionName}</p>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 text-sm">
                                   <div>
                                     <span className="text-muted-foreground">UTME:</span> {entry.utme}
                                   </div>
                                   <div>
                                     <span className="text-muted-foreground">Score:</span> {entry.result.compositeScore.toFixed(1)}
                                   </div>
                                   {entry.result.probability && (
                                     <div className="col-span-2">
                                       <span className="text-muted-foreground">Probability: </span>
                                       {(entry.result.probability * 100).toFixed(0)}%
                                     </div>
                                   )}
                                   <div className="col-span-2">
                                     <Badge variant={entry.result.category === "safe" ? "default" : entry.result.category === "target" ? "secondary" : "destructive"}>
                                       {entry.result.category}
                                     </Badge>
                                   </div>
                                 </div>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => toggleComparison(entry.id)}
                                   className="w-full"
                                 >
                                   Remove from Comparison
                                 </Button>
                               </div>
                             </Card>
                           ))}
                         </div>
                       </DialogContent>
                     </Dialog>
                   )}
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

          {result && (
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
                    <p className="text-lg font-semibold capitalize">{result.category}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Rationale</p>
                    <p className="text-sm">{result.rationale}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Data Quality</p>
                    <p className="text-xs capitalize">
                      {result.dataQuality.cutoffConfidence}
                      {result.dataQuality.historicalDataYears &&
                        ` • ${result.dataQuality.historicalDataYears} years of data`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      </main>
      <Footer />
    </div>
  )
}

