"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { usePrograms } from "@/lib/hooks/use-programs"
import { Search, GraduationCap, Building2, X, DollarSign, Plus, Trash2, Calculator, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface FeeCalculationResult {
  programId: string
  programName: string
  institutionName: string
  institutionType: string
  duration: number
  breakdown: {
    tuition: number
    accommodation: number
    books: number
    transport: number
    feeding: number
    miscellaneous: number
    total: number
    perYear: number
    totalDuration: number
  }
  currency: string
  hasFeeData: boolean
  hasAccommodationData: boolean
}

export default function FeeCalculatorPage() {
  const [selectedPrograms, setSelectedPrograms] = useState<any[]>([])
  const [programSearch, setProgramSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  const [duration, setDuration] = useState<string>("")
  const [accommodation, setAccommodation] = useState(false)
  const [accommodationType, setAccommodationType] = useState<"on_campus" | "off_campus">("on_campus")
  const [otherExpenses, setOtherExpenses] = useState({
    books: "",
    transport: "",
    feeding: "",
    miscellaneous: "",
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FeeCalculationResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const programDropdownRef = useRef<HTMLDivElement>(null)

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

  const handleAddProgram = (program: any) => {
    if (selectedPrograms.length >= 5) {
      setError("Maximum 5 programs can be compared at once")
      return
    }
    if (!selectedPrograms.find((p) => p.id === program.id)) {
      setSelectedPrograms([...selectedPrograms, program])
      setProgramSearch("")
      setShowProgramDropdown(false)
      setError(null)
    }
  }

  const handleRemoveProgram = (programId: string) => {
    setSelectedPrograms(selectedPrograms.filter((p) => p.id !== programId))
  }

  const handleCalculate = async () => {
    if (selectedPrograms.length === 0) {
      setError("Please select at least one program")
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch("/api/calculate/fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programIds: selectedPrograms.map((p) => p.id),
          duration: duration ? parseInt(duration) : undefined,
          accommodation,
          accommodationType: accommodation ? accommodationType : undefined,
          otherExpenses: {
            books: otherExpenses.books ? parseFloat(otherExpenses.books) : undefined,
            transport: otherExpenses.transport ? parseFloat(otherExpenses.transport) : undefined,
            feeding: otherExpenses.feeding ? parseFloat(otherExpenses.feeding) : undefined,
            miscellaneous: otherExpenses.miscellaneous ? parseFloat(otherExpenses.miscellaneous) : undefined,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to calculate fees")
      }

      const data = await response.json()
      setResults(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Fee Calculator</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Calculate total costs for your chosen programs including tuition, accommodation, and other expenses
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Select Programs</CardTitle>
              <CardDescription>
                Add up to 5 programs to compare fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Program Search */}
              <div className="relative" ref={programDropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={programSearch}
                    onChange={(e) => {
                      setProgramSearch(e.target.value)
                      setShowProgramDropdown(true)
                    }}
                    onFocus={() => setShowProgramDropdown(true)}
                    placeholder="Search for a program..."
                    className="pl-10"
                  />
                </div>

                {showProgramDropdown && programSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {programsLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : programs.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No programs found
                      </div>
                    ) : (
                      <div className="p-1">
                        {programs
                          .filter((p) => !selectedPrograms.find((sp) => sp.id === p.id))
                          .map((program) => (
                            <button
                              key={program.id}
                              onClick={() => handleAddProgram(program)}
                              className="w-full text-left p-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <GraduationCap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{program.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {program.institution?.name}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Programs */}
              {selectedPrograms.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Programs ({selectedPrograms.length}/5)</Label>
                  {selectedPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{program.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {program.institution?.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveProgram(program.id)}
                        className="h-8 w-8 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Duration */}
              <div>
                <Label htmlFor="duration">Duration (Years)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="10"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Auto (from program)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use program duration
                </p>
              </div>

              {/* Accommodation */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accommodation"
                    checked={accommodation}
                    onCheckedChange={(checked) => setAccommodation(checked === true)}
                  />
                  <Label htmlFor="accommodation" className="cursor-pointer">
                    Include Accommodation
                  </Label>
                </div>
                {accommodation && (
                  <Select
                    value={accommodationType}
                    onValueChange={(value: "on_campus" | "off_campus") => setAccommodationType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_campus">On-Campus</SelectItem>
                      <SelectItem value="off_campus">Off-Campus</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Other Expenses */}
              <div className="space-y-3">
                <Label>Other Expenses (per year)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="books" className="text-xs">Books</Label>
                    <Input
                      id="books"
                      type="number"
                      min="0"
                      value={otherExpenses.books}
                      onChange={(e) => setOtherExpenses({ ...otherExpenses, books: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transport" className="text-xs">Transport</Label>
                    <Input
                      id="transport"
                      type="number"
                      min="0"
                      value={otherExpenses.transport}
                      onChange={(e) => setOtherExpenses({ ...otherExpenses, transport: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feeding" className="text-xs">Feeding</Label>
                    <Input
                      id="feeding"
                      type="number"
                      min="0"
                      value={otherExpenses.feeding}
                      onChange={(e) => setOtherExpenses({ ...otherExpenses, feeding: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="miscellaneous" className="text-xs">Miscellaneous</Label>
                    <Input
                      id="miscellaneous"
                      type="number"
                      min="0"
                      value={otherExpenses.miscellaneous}
                      onChange={(e) => setOtherExpenses({ ...otherExpenses, miscellaneous: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading || selectedPrograms.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Calculator className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Fees
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Breakdown</CardTitle>
              <CardDescription>
                Detailed cost breakdown for selected programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select programs and click &quot;Calculate Fees&quot; to see results</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {results.map((result) => (
                    <div key={result.programId} className="border rounded-lg p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{result.programName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.institutionName} • {result.institutionType}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {!result.hasFeeData && (
                            <Badge variant="outline" className="text-xs">
                              Fee data unavailable
                            </Badge>
                          )}
                          {result.hasAccommodationData && accommodation && (
                            <Badge variant="secondary" className="text-xs">
                              Accommodation included
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Tuition Fees</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(result.breakdown.tuition, result.currency)}
                            </TableCell>
                          </TableRow>
                          {accommodation && (
                            <TableRow>
                              <TableCell className="font-medium">Accommodation</TableCell>
                              <TableCell className="text-right">
                                {result.breakdown.accommodation > 0
                                  ? formatCurrency(result.breakdown.accommodation, result.currency)
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          )}
                          {result.breakdown.books > 0 && (
                            <TableRow>
                              <TableCell className="font-medium">Books</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(result.breakdown.books, result.currency)}
                              </TableCell>
                            </TableRow>
                          )}
                          {result.breakdown.transport > 0 && (
                            <TableRow>
                              <TableCell className="font-medium">Transport</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(result.breakdown.transport, result.currency)}
                              </TableCell>
                            </TableRow>
                          )}
                          {result.breakdown.feeding > 0 && (
                            <TableRow>
                              <TableCell className="font-medium">Feeding</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(result.breakdown.feeding, result.currency)}
                              </TableCell>
                            </TableRow>
                          )}
                          {result.breakdown.miscellaneous > 0 && (
                            <TableRow>
                              <TableCell className="font-medium">Miscellaneous</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(result.breakdown.miscellaneous, result.currency)}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="font-bold border-t-2">
                            <TableCell>Total ({result.duration} years)</TableCell>
                            <TableCell className="text-right text-lg text-primary">
                              {formatCurrency(result.breakdown.total, result.currency)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-muted-foreground">Per Year</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(result.breakdown.perYear, result.currency)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

