"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePrograms } from "@/lib/hooks/use-programs"
import { Search, GraduationCap, Building2, X, Plus, TrendingUp, DollarSign, Clock, BookOpen, Share2 } from "lucide-react"
import Link from "next/link"

export default function ComparisonPage() {
  const [selectedPrograms, setSelectedPrograms] = useState<any[]>([])
  const [programSearch, setProgramSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
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
      alert("You can compare up to 5 programs at once")
      return
    }
    if (selectedPrograms.some((p) => p.id === program.id)) {
      alert("This program is already in the comparison")
      return
    }
    setSelectedPrograms([...selectedPrograms, program])
    setProgramSearch("")
    setShowProgramDropdown(false)
  }

  const handleRemoveProgram = (programId: string) => {
    setSelectedPrograms(selectedPrograms.filter((p) => p.id !== programId))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4">Compare Programs</h1>
            <p className="text-muted-foreground">
              Compare up to 5 programs side-by-side to make informed decisions
            </p>
          </div>
          {selectedPrograms.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const programIds = selectedPrograms.map((p) => p.id).join(",")
                const url = `${window.location.origin}/comparison?programs=${programIds}`
                navigator.clipboard.writeText(url)
                alert("Comparison link copied to clipboard!")
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Comparison
            </Button>
          )}
        </div>

        {/* Add Programs Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Programs to Compare</CardTitle>
            <CardDescription>
              Search and select programs to compare (up to 5 programs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative" ref={programDropdownRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={programSearch}
                onChange={(e) => {
                  setProgramSearch(e.target.value)
                  setShowProgramDropdown(true)
                }}
                onFocus={() => setShowProgramDropdown(true)}
                placeholder="Search for programs to compare..."
                className="pl-10"
                disabled={selectedPrograms.length >= 5}
              />

              {showProgramDropdown && programSearch && selectedPrograms.length < 5 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
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
                      {programs
                        .filter((p: any) => !selectedPrograms.some((sp) => sp.id === p.id))
                        .map((program: any) => (
                          <button
                            key={program.id}
                            onClick={() => handleAddProgram(program)}
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
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedPrograms.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPrograms.map((program) => (
                  <Badge
                    key={program.id}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <span className="text-xs">{program.name}</span>
                    <button
                      onClick={() => handleRemoveProgram(program.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {selectedPrograms.length >= 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                Maximum of 5 programs can be compared at once. Remove a program to add another.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {selectedPrograms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Program Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of {selectedPrograms.length} program
                {selectedPrograms.length > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Attribute</TableHead>
                      {selectedPrograms.map((program) => (
                        <TableHead key={program.id} className="min-w-[250px]">
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/programs/${program.id}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {program.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {program.institution?.name}
                            </p>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Institution */}
                    <TableRow>
                      <TableCell className="font-medium">Institution</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{program.institution?.name}</span>
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {program.institution?.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {program.institution?.state}
                            </Badge>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Degree Type */}
                    <TableRow>
                      <TableCell className="font-medium">Degree Type</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          {program.degreeType || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Duration */}
                    <TableRow>
                      <TableCell className="font-medium">Duration</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          {program.duration ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{program.duration}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Faculty */}
                    <TableRow>
                      <TableCell className="font-medium">Faculty</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          {program.faculty || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* UTME Subjects */}
                    <TableRow>
                      <TableCell className="font-medium">UTME Subjects</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          {program.utmeSubjects && program.utmeSubjects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {program.utmeSubjects.map((subject: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* O-Level Subjects */}
                    <TableRow>
                      <TableCell className="font-medium">O-Level Subjects</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          {program.olevelSubjects && program.olevelSubjects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {program.olevelSubjects.map((subject: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Latest Cutoff */}
                    <TableRow>
                      <TableCell className="font-medium">Latest Cutoff</TableCell>
                      {selectedPrograms.map((program) => {
                        const cutoffHistory = Array.isArray(program.cutoffHistory)
                          ? program.cutoffHistory
                          : []
                        const latestCutoff = cutoffHistory.length > 0 ? cutoffHistory[0] : null
                        return (
                          <TableCell key={program.id}>
                            {latestCutoff ? (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <div>
                                  <span className="font-semibold">{latestCutoff.cutoff}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({latestCutoff.year})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>

                    {/* Tuition Fees */}
                    <TableRow>
                      <TableCell className="font-medium">Tuition Fees</TableCell>
                      {selectedPrograms.map((program) => {
                        const fees = program.tuitionFees as any
                        return (
                          <TableCell key={program.id}>
                            {fees?.amount ? (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span>
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency: fees.currency || "NGN",
                                    minimumFractionDigits: 0,
                                  }).format(fees.amount)}
                                  {fees.per_year ? " / year" : ""}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>

                    {/* Application Deadline */}
                    <TableRow>
                      <TableCell className="font-medium">Application Deadline</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          {program.applicationDeadline ? (
                            <div>
                              <span>
                                {new Date(program.applicationDeadline).toLocaleDateString("en-NG", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              {new Date(program.applicationDeadline) > new Date() && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Math.ceil(
                                    (new Date(program.applicationDeadline).getTime() -
                                      new Date().getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )}{" "}
                                  days remaining
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Actions */}
                    <TableRow>
                      <TableCell className="font-medium">Actions</TableCell>
                      {selectedPrograms.map((program) => (
                        <TableCell key={program.id}>
                          <div className="flex flex-col gap-2">
                            <Link href={`/programs/${program.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            <Link href={`/calculator?programId=${program.id}`}>
                              <Button variant="default" size="sm" className="w-full">
                                Calculate Eligibility
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedPrograms.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No programs selected</h3>
              <p className="text-muted-foreground mb-4">
                Search and add programs above to start comparing
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  )
}
