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
import { Building2, Plus, Search, Edit, ExternalLink, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Institution {
  id: string
  name: string
  type: string
  ownership: string
  state: string
  city: string
  website?: string | null
  _count: {
    programs: number
  }
}

function useInstitutions(params: {
  page?: number
  limit?: number
  search?: string
  type?: string
  ownership?: string
  missingWebsite?: boolean
}) {
  return useQuery<{
    data: Institution[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>({
    queryKey: ["admin-institutions", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", params.page.toString())
      if (params.limit) searchParams.set("limit", params.limit.toString())
      if (params.search) searchParams.set("search", params.search)
      if (params.type) searchParams.set("type", params.type)
      if (params.ownership) searchParams.set("ownership", params.ownership)
      if (params.missingWebsite) searchParams.set("missingWebsite", "true")

      const response = await fetch(`/api/admin/institutions?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch institutions")
      return response.json()
    },
  })
}

export default function InstitutionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("all")
  const [ownership, setOwnership] = useState("all")
  const [missingWebsite, setMissingWebsite] = useState(false)

  const { data, isLoading, isError, error } = useInstitutions({
    page,
    limit: 20,
    search: search || undefined,
    type: type !== "all" ? type : undefined,
    ownership: ownership !== "all" ? ownership : undefined,
    missingWebsite,
  })

  const institutions = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Institutions</h1>
          <p className="text-muted-foreground mt-2">
            Manage institutions and their information
          </p>
        </div>
        <Link href="/admin/institutions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Institution
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
                placeholder="Search institutions..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="polytechnic">Polytechnic</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="nursing">Nursing</SelectItem>
                <SelectItem value="military">Military</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ownership} onValueChange={setOwnership}>
              <SelectTrigger>
                <SelectValue placeholder="All Ownership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ownership</SelectItem>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="missingWebsite"
                checked={missingWebsite}
                onChange={(e) => {
                  setMissingWebsite(e.target.checked)
                  setPage(1)
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor="missingWebsite" className="text-sm font-medium cursor-pointer">
                Missing Website
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination ? `${pagination.total} Institutions` : "Institutions"}
          </CardTitle>
          <CardDescription>
            {missingWebsite && "Showing only institutions without websites"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium mb-2">Error loading institutions</p>
              <p className="text-muted-foreground text-sm">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
            </div>
          ) : institutions.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No institutions found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Programs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.map((institution) => (
                    <TableRow key={institution.id}>
                      <TableCell className="font-medium">{institution.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{institution.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{institution.ownership}</Badge>
                      </TableCell>
                      <TableCell>
                        {institution.city}, {institution.state}
                      </TableCell>
                      <TableCell>
                        {institution.website ? (
                          <a
                            href={institution.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                          </a>
                        ) : (
                          <Badge variant="outline" className="text-destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{institution._count.programs}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/institutions/${institution.id}`}>
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

