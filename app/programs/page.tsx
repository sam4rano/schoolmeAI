"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Search, GraduationCap, Clock, BookOpen, TrendingUp, Loader2, Calendar, ChevronLeft, ChevronRight, Award, TrendingDown } from "lucide-react"
import { usePrograms } from "@/lib/hooks/use-programs"
import { useInstitutions } from "@/lib/hooks/use-institutions"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"

function ProgramCard({ program }: { program: any }) {
  const cutoffHistory = Array.isArray(program.cutoffHistory) ? program.cutoffHistory : []
  const latestCutoff = cutoffHistory.length > 0 ? cutoffHistory[0] : null
  
  // Get difficulty badge info
  const getDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) return null
    
    const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      very_competitive: { label: "Very Competitive", variant: "destructive", icon: TrendingUp },
      competitive: { label: "Competitive", variant: "default", icon: TrendingUp },
      moderate: { label: "Moderate", variant: "secondary", icon: Award },
      less_competitive: { label: "Less Competitive", variant: "outline", icon: TrendingDown },
    }
    
    const config = configs[difficulty]
    if (!config) return null
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="text-xs flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold mb-1.5 line-clamp-2 leading-tight">{program.name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-medium text-muted-foreground">{program.institution?.name}</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {program.institution?.type}
              </Badge>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {program.institution?.state}
              </Badge>
              {getDifficultyBadge(program.institutionDifficulty)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {program.degreeType && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{program.degreeType}</span>
            </div>
          )}

          {program.duration && program.duration !== "17 years" && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{program.duration}</span>
            </div>
          )}

          {program.faculty && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground line-clamp-1">{program.faculty}</span>
            </div>
          )}

          {program.utmeSubjects && program.utmeSubjects.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">UTME Subjects:</p>
              <div className="flex flex-wrap gap-1">
                {program.utmeSubjects.slice(0, 3).map((subject: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {subject}
                  </Badge>
                ))}
                {program.utmeSubjects.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{program.utmeSubjects.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {latestCutoff && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Latest Cutoff ({latestCutoff.year})</p>
                <p className="text-sm font-semibold text-primary">{latestCutoff.cutoff}</p>
              </div>
            </div>
          )}

          {program.applicationDeadline && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Application Deadline</p>
                <p className="text-sm font-semibold">
                  {new Date(program.applicationDeadline).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {(() => {
                  const daysRemaining = Math.ceil(
                    (new Date(program.applicationDeadline).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                  if (daysRemaining < 0) return null
                  if (daysRemaining <= 7) {
                    return (
                      <p className="text-xs text-red-600 font-semibold mt-0.5">
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left!
                      </p>
                    )
                  }
                  return (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                    </p>
                  )
                })()}
              </div>
            </div>
          )}

          {program.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {program.description.substring(0, 80)}...
            </p>
          )}

          <div className="pt-2 flex gap-2">
            <Link href={`/programs/${program.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
            <Link href={`/calculator?programId=${program.id}`} className="flex-1">
              <Button variant="default" size="sm" className="w-full">
                Calculate
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProgramsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [degreeType, setDegreeType] = useState("all")
  const [institutionId, setInstitutionId] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [debouncedQuery, setDebouncedQuery] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCourse, degreeType, institutionId, debouncedQuery])

  // Fetch institutions for filter
  const { data: institutionsData } = useInstitutions({ limit: 1000 })
  const institutions = institutionsData?.data || []

  // Fetch available courses for dropdown
  const { data: coursesData } = useQuery<string[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const response = await fetch("/api/programs/courses")
      if (!response.ok) throw new Error("Failed to fetch courses")
      const data = await response.json()
      return data.data || []
    },
  })
  const courses = coursesData || []

  // Fetch programs with filters
  const { data: programsData, isLoading } = usePrograms({
    query: selectedCourse === "all" ? (debouncedQuery || undefined) : undefined,
    course: selectedCourse !== "all" ? selectedCourse : undefined,
    degreeType: degreeType !== "all" ? degreeType : undefined,
    institution_id: institutionId !== "all" ? institutionId : undefined,
    page: currentPage,
    limit: 18, // Show 18 per page (3 columns x 6 rows)
    rankByDifficulty: selectedCourse !== "all", // Rank by difficulty when course is selected
  })

  const programs = programsData?.data || []
  const pagination = programsData?.pagination

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Programs</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Browse all available programs across Nigerian institutions
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by institution (e.g., unilag, ui, oau)..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={selectedCourse !== "all"}
                />
              </div>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course: string) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={degreeType} onValueChange={setDegreeType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Degree Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degree Types</SelectItem>
                  <SelectItem value="BSc">BSc</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="BEng">BEng</SelectItem>
                  <SelectItem value="BTech">BTech</SelectItem>
                  <SelectItem value="BEd">BEd</SelectItem>
                  <SelectItem value="MBBS">MBBS</SelectItem>
                  <SelectItem value="LLB">LLB</SelectItem>
                  <SelectItem value="BPharm">BPharm</SelectItem>
                  <SelectItem value="BAgric">BAgric</SelectItem>
                  <SelectItem value="BArch">BArch</SelectItem>
                  <SelectItem value="ND">ND</SelectItem>
                  <SelectItem value="HND">HND</SelectItem>
                  <SelectItem value="NCE">NCE</SelectItem>
                  <SelectItem value="OND">OND</SelectItem>
                </SelectContent>
              </Select>
              <Select value={institutionId} onValueChange={setInstitutionId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Institutions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCourse !== "all" && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-primary/5 rounded-md border border-primary/20">
                <p className="text-xs sm:text-sm font-medium text-primary">
                  Showing institutions offering <span className="font-bold">{selectedCourse}</span>, ranked by admission difficulty
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Institutions are ranked from most competitive (highest cutoffs) to less competitive
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="pt-2 border-t">
                      <Skeleton className="h-4 w-1/2 mb-1" />
                      <Skeleton className="h-5 w-1/3" />
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No programs found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {debouncedQuery || degreeType !== "all" || institutionId !== "all"
                  ? "Try adjusting your search or filters"
                  : "Programs will appear here once scraped from MySchoolGist"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Found {pagination?.total || programs.length} program{pagination?.total !== 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program: any) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Page {pagination.page} of {pagination.totalPages} • {pagination.total} total programs
                </p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}


