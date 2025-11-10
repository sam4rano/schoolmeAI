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
import { Sparkles, Loader2, Building2, TrendingUp, GraduationCap, Share2, Copy, Download, Info, Filter, Trash2, Calculator } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { RecommendationsForm } from "@/components/recommendations/recommendations-form"
import { RecommendationsFilters } from "@/components/recommendations/recommendations-filters"
import { RecommendationCard } from "@/components/recommendations/recommendation-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

        <RecommendationsForm
          utme={utme}
          setUtme={setUtme}
          olevels={olevels}
          setOlevels={setOlevels}
          availableSubjects={availableSubjects}
          onGetRecommendations={handleGetRecommendations}
        />
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
              <RecommendationsFilters
                filters={filters}
                setFilters={setFilters}
                showRankingExplanation={showRankingExplanation}
                setShowRankingExplanation={setShowRankingExplanation}
                onShare={handleShare}
                onCopyLink={handleCopyLink}
                onExport={handleExportPDF}
              />
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

                {programs.map((program, index) => (
                  <RecommendationCard
                    key={program.id}
                    program={program}
                    rank={index + 1}
                  />
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
