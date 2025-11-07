"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { GraduationCap, Plus, Search, Edit, AlertCircle, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Program {
  id: string
  name: string
  degreeType?: string | null
  institution: {
    id: string
    name: string
    type: string
    state: string
  }
  cutoffHistory?: any[] | null
  description?: string | null
}

function usePrograms(params: {
  page?: number
  limit?: number
  search?: string
  institutionId?: string
  degreeType?: string
  missingCutoff?: boolean
  missingDescription?: boolean
}) {
  return useQuery<{
    data: Program[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>({
    queryKey: ["admin-programs", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", params.page.toString())
      if (params.limit) searchParams.set("limit", params.limit.toString())
      if (params.search) searchParams.set("search", params.search)
      if (params.institutionId) searchParams.set("institutionId", params.institutionId)
      if (params.degreeType) searchParams.set("degreeType", params.degreeType)
      if (params.missingCutoff) searchParams.set("missingCutoff", "true")
      if (params.missingDescription) searchParams.set("missingDescription", "true")

      const response = await fetch(`/api/admin/programs?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch programs")
      return response.json()
    },
  })
}

export default function ProgramsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [degreeType, setDegreeType] = useState("all")
  const [missingCutoff, setMissingCutoff] = useState(false)
  const [missingDescription, setMissingDescription] = useState(false)

  const { data, isLoading } = usePrograms({
    page,
    limit: 20,
    search: search || undefined,
    degreeType: degreeType !== "all" ? degreeType : undefined,
    missingCutoff,
    missingDescription,
  })

  const programs = data?.data || []
  const pagination = data?.pagination

  const hasCutoffData = (program: Program) => {
    return program.cutoffHistory && Array.isArray(program.cutoffHistory) && program.cutoffHistory.length > 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Programs</h1>
          <p className="text-muted-foreground mt-2">
            Manage programs and cutoff data
          </p>
        </div>
        <Link href="/admin/programs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select value={degreeType} onValueChange={setDegreeType}>
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
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="missingCutoff"
                checked={missingCutoff}
                onChange={(e) => {
                  setMissingCutoff(e.target.checked)
                  setPage(1)
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor="missingCutoff" className="text-sm font-medium cursor-pointer">
                Missing Cutoff
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="missingDescription"
                checked={missingDescription}
                onChange={(e) => {
                  setMissingDescription(e.target.checked)
                  setPage(1)
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor="missingDescription" className="text-sm font-medium cursor-pointer">
                Missing Description
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination ? `${pagination.total} Programs` : "Programs"}
          </CardTitle>
          <CardDescription>
            {missingCutoff && "Showing only programs without cutoff data"}
            {missingDescription && "Showing only programs without descriptions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No programs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Degree Type</TableHead>
                    <TableHead>Cutoff Data</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{program.institution.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {program.institution.type} • {program.institution.state}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.degreeType ? (
                          <Badge variant="outline">{program.degreeType}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasCutoffData(program) ? (
                          <Badge variant="default" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {Array.isArray(program.cutoffHistory) ? program.cutoffHistory.length : 0} entries
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {program.description ? (
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {program.description.substring(0, 50)}...
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/programs/${program.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
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
    </div>
  )
}

