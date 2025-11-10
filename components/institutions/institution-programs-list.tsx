"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { GraduationCap, Search, TrendingUp, ExternalLink, Loader2 } from "lucide-react"
import { usePrograms } from "@/lib/hooks/use-programs"
import { Skeleton } from "@/components/ui/skeleton"

interface InstitutionProgramsListProps {
  institutionId: string
  institutionName: string
}

export function InstitutionProgramsList({
  institutionId,
  institutionName,
}: InstitutionProgramsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [degreeType, setDegreeType] = useState("all")
  const [accreditationStatus, setAccreditationStatus] = useState("all")
  const [page, setPage] = useState(1)

  const { data: programsData, isLoading } = usePrograms({
    institution_id: institutionId,
    query: searchQuery || undefined,
    degreeType: degreeType !== "all" ? degreeType : undefined,
    accreditationStatus: accreditationStatus !== "all" ? accreditationStatus : undefined,
    page,
    limit: 12,
  })

  const programs = programsData?.data || []
  const pagination = programsData?.pagination

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Programs at {institutionName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={degreeType}
            onValueChange={(value) => {
              setDegreeType(value)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Degree Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Degree Types</SelectItem>
              <SelectItem value="BSc">BSc</SelectItem>
              <SelectItem value="BA">BA</SelectItem>
              <SelectItem value="BEng">BEng</SelectItem>
              <SelectItem value="MBBS">MBBS</SelectItem>
              <SelectItem value="LLB">LLB</SelectItem>
              <SelectItem value="ND">ND</SelectItem>
              <SelectItem value="HND">HND</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={accreditationStatus}
            onValueChange={(value) => {
              setAccreditationStatus(value)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Full">Fully Accredited</SelectItem>
              <SelectItem value="Interim">Interim</SelectItem>
              <SelectItem value="Denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Programs List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No programs found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {programs.map((program: any) => {
                const latestCutoff = Array.isArray(program.cutoffHistory)
                  ? program.cutoffHistory[0]
                  : null

                return (
                  <Link
                    key={program.id}
                    href={`/programs/${program.id}`}
                    className="block p-4 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-2">
                          {program.name}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {program.degreeType && (
                            <Badge variant="outline" className="text-xs">
                              {program.degreeType}
                            </Badge>
                          )}
                          {program.accreditationStatus && (
                            <Badge
                              variant={
                                program.accreditationStatus === "Full"
                                  ? "default"
                                  : program.accreditationStatus === "Interim"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {program.accreditationStatus}
                            </Badge>
                          )}
                        </div>
                        {latestCutoff && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span>
                              Cutoff: {typeof latestCutoff === "object" ? latestCutoff.cutoff : latestCutoff}
                            </span>
                          </div>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

