"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { useRecommendations } from "@/lib/hooks/use-recommendations"
import { GraduationCap, Building2, TrendingUp, Sparkles, Loader2, Calculator, Trash2, Download, Share2, Copy, Info, Filter, MapPin, DollarSign } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { NIGERIAN_STATES_WITH_ABUJA } from "@/lib/constants/nigerian-states"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function RecommendationsPage() {
  const { toast } = useToast()
  const [utme, setUtme] = useState("")
  const [olevels, setOlevels] = useState<Record<string, string>>({
    "English Language": "none",
  })
  const availableSubjects = COMMON_OLEVEL_SUBJECTS.filter((s) => s !== "English Language")
  const [showResults, setShowResults] = useState(false)
  const [filters, setFilters] = useState({
    state: "",
    institutionType: "",
    category: "",
    minProbability: "",
  })
  const [showRankingExplanation, setShowRankingExplanation] = useState(false)

  const { data, isLoading, error } = useRecommendations(
    showResults && utme
      ? {
          utme: parseInt(utme),
          olevels: Object.fromEntries(
            Object.entries(olevels).filter(([_, value]) => value !== "" && value !== "none")
          ),
          limit: 50,
        }
      : undefined
  )

  // Apply filters to programs
  const filteredPrograms = (data?.data || []).filter((program) => {
    if (filters.state && program.institution.state !== filters.state) return false
    if (filters.institutionType && program.institution.type !== filters.institutionType) return false
    if (filters.category && program.eligibility.category !== filters.category) return false
    if (filters.minProbability && program.eligibility.probability < parseFloat(filters.minProbability) / 100) return false
    return true
  })

  const handleGetRecommendations = () => {
    if (utme && Object.values(olevels).some((v) => v && v !== "none")) {
      setShowResults(true)
      setFilters({ state: "", institutionType: "", category: "", minProbability: "" })
    }
  }

  const handleExportPDF = async () => {
    try {
      // Export as CSV (PDF export requires jspdf library)
      const csv = [
        ["Rank", "Program", "Institution", "Location", "Type", "Probability", "Category", "Composite Score"],
        ...filteredPrograms.map((program, index) => [
          index + 1,
          program.name,
          program.institution.name,
          program.institution.state,
          program.institution.type,
          `${(program.eligibility.probability * 100).toFixed(0)}%`,
          program.eligibility.category.toUpperCase(),
          program.eligibility.compositeScore.toFixed(1),
        ]),
      ]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `recommendations-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Recommendations exported to CSV",
      })
    } catch (error) {
      console.error("Error exporting:", error)
      toast({
        title: "Error",
        description: "Failed to export recommendations",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: "My Program Recommendations",
      text: `I got ${filteredPrograms.length} program recommendations based on my UTME score of ${utme}!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: "Success",
          description: "Recommendations shared",
        })
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Success",
          description: "Link copied to clipboard",
        })
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast({
            title: "Success",
            description: "Link copied to clipboard",
          })
        } catch (clipboardError) {
          toast({
            title: "Error",
            description: "Failed to share",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const programs = filteredPrograms
  const meta = data?.meta

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Program Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Get personalized program recommendations based on your JAMB and O-level scores
          </p>
        </div>

        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Enter Your Scores</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Fill in your UTME score and O-level grades to get recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
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
                    <SelectTrigger className="w-full sm:w-[200px]">
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

            <Button
              onClick={handleGetRecommendations}
              disabled={!utme || !Object.values(olevels).some((v) => v && v !== "none")}
              className="w-full"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Get Recommendations
            </Button>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
            </CardContent>
          </Card>
        )}

        {showResults && !isLoading && !error && (
          <>
                   {meta && (
                     <Card className="mb-4 sm:mb-6">
                       <CardContent className="pt-4 sm:pt-6">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Composite Score</p>
                      <p className="text-2xl font-bold text-primary">{meta.compositeScore.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Programs Analyzed</p>
                      <p className="text-2xl font-bold">{meta.totalPrograms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recommendations</p>
                      <p className="text-2xl font-bold text-green-600">{meta.recommended}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters and Actions */}
            {filteredPrograms.length > 0 && (
              <Card className="mb-4 sm:mb-6">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                      Filters &amp; Actions
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Dialog open={showRankingExplanation} onOpenChange={setShowRankingExplanation}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Info className="h-4 w-4 mr-2" />
                            How Ranking Works
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>How Recommendations Are Ranked</DialogTitle>
                            <DialogDescription>
                              Understanding how we calculate and rank program recommendations
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 text-sm">
                            <div>
                              <h3 className="font-semibold mb-2">1. Composite Score Calculation</h3>
                              <p className="text-muted-foreground">
                                Your composite score combines your UTME score (60%), O-level grades (40%), and optionally Post-UTME score.
                                The formula: <code className="bg-muted px-1 rounded">Composite = 0.6 × UTME + 0.4 × O-level</code>
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">2. Probability Estimation</h3>
                              <p className="text-muted-foreground">
                                We use historical cutoff data and logistic regression to estimate your admission probability for each program.
                                Programs with more historical data provide more accurate estimates.
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">3. Category Classification</h3>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li><strong>Safe:</strong> High probability (≥70%) - Programs you&apos;re likely to get admitted to</li>
                                <li><strong>Target:</strong> Moderate probability (40-70%) - Programs that match your scores</li>
                                <li><strong>Reach:</strong> Lower probability (30-40%) - Programs that are challenging but possible</li>
                              </ul>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">4. Ranking Order</h3>
                              <p className="text-muted-foreground">
                                Programs are sorted by:
                              </p>
                              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                                <li>Admission probability (highest first)</li>
                                <li>Category (Safe → Target → Reach)</li>
                                <li>Institution reputation and data quality</li>
                              </ol>
                            </div>
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertTitle>Note</AlertTitle>
                              <AlertDescription>
                                Recommendations are based on historical data and statistical models. Actual admission decisions depend on many factors including competition, quotas, and institutional policies.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleShare}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share via...
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleCopyLink}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5">State</label>
                      <Select
                        value={filters.state}
                        onValueChange={(value) => setFilters({ ...filters, state: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All States" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All States</SelectItem>
                          {NIGERIAN_STATES_WITH_ABUJA.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Institution Type</label>
                      <Select
                        value={filters.institutionType}
                        onValueChange={(value) => setFilters({ ...filters, institutionType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Types</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="polytechnic">Polytechnic</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                          <SelectItem value="nursing">Nursing</SelectItem>
                          <SelectItem value="military">Military</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Category</label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => setFilters({ ...filters, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          <SelectItem value="safe">Safe</SelectItem>
                          <SelectItem value="target">Target</SelectItem>
                          <SelectItem value="reach">Reach</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Min Probability (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.minProbability}
                        onChange={(e) => setFilters({ ...filters, minProbability: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {programs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {data?.data && data.data.length > 0
                      ? "No programs match your filters. Try adjusting your filters."
                      : "No suitable programs found. Try adjusting your scores or check back later."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Recommended Programs</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing {programs.length} of {data?.data.length || 0} recommendations
                    </p>
                  </div>
                  <Badge variant="secondary">{programs.length} programs</Badge>
                </div>

                {programs.map((program) => (
                  <Card key={program.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-2">{program.name}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground mt-1">
                            <Building2 className="h-4 w-4" />
                            <span>{program.institution.name}</span>
                            <Badge variant="outline">{program.institution.type}</Badge>
                            <Badge variant="secondary">{program.institution.state}</Badge>
                            {program.degreeType && (
                              <Badge variant="outline">{program.degreeType}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              program.eligibility.category === "safe"
                                ? "default"
                                : program.eligibility.category === "target"
                                ? "secondary"
                                : "outline"
                            }
                            className="mb-2"
                          >
                            {program.eligibility.category.toUpperCase()}
                          </Badge>
                          <p className="text-2xl font-bold text-primary">
                            {(program.eligibility.probability * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Admission Probability</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

