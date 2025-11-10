"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useInstitutions } from "@/lib/hooks/use-institutions"
import { NIGERIAN_STATES_WITH_ABUJA } from "@/lib/constants/nigerian-states"
import { Search, Filter, MapPin, Globe, Building2, DollarSign, ExternalLink } from "lucide-react"
import { AdvancedSearch, SearchFilters } from "@/components/search/advanced-search"
import { formatInstitutionName } from "@/lib/utils/institution-name"

export default function InstitutionsPage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [page, setPage] = useState(1)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchFilters])

  const { data, isLoading, error } = useInstitutions({
    query: searchFilters.query,
    type: searchFilters.type,
    ownership: searchFilters.ownership,
    state: searchFilters.state,
    page,
    limit: 12,
  })

  // Deduplicate institutions by ID (in case of API issues)
  const institutionsRaw = data?.data || []
  const seenIds = new Set<string>()
  const institutions = institutionsRaw.filter((inst: any) => {
    if (seenIds.has(inst.id)) {
      return false
    }
    seenIds.add(inst.id)
    return true
  })
  const pagination = data?.pagination

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Institutions</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Browse all Nigerian higher institutions
          </p>
        </div>

        {/* Advanced Search */}
        <div className="mb-4 sm:mb-6">
          <AdvancedSearch
            type="institutions"
            onSearch={(filters) => {
              setSearchFilters(filters)
              setPage(1)
            }}
            initialFilters={searchFilters}
          />
        </div>

        {/* Active Filters Display */}
        {Object.keys(searchFilters).length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-wrap gap-2">
                {searchFilters.query && (
                  <Badge variant="secondary" className="gap-2">
                    Search: {searchFilters.query}
                    <button
                      onClick={() => {
                        const newFilters = { ...searchFilters }
                        delete newFilters.query
                        setSearchFilters(newFilters)
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchFilters.type && (
                  <Badge variant="secondary" className="gap-2">
                    Type: {searchFilters.type}
                    <button
                      onClick={() => {
                        const newFilters = { ...searchFilters }
                        delete newFilters.type
                        setSearchFilters(newFilters)
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchFilters.ownership && (
                  <Badge variant="secondary" className="gap-2">
                    Ownership: {searchFilters.ownership}
                    <button
                      onClick={() => {
                        const newFilters = { ...searchFilters }
                        delete newFilters.ownership
                        setSearchFilters(newFilters)
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchFilters.state && (
                  <Badge variant="secondary" className="gap-2">
                    State: {searchFilters.state}
                    <button
                      onClick={() => {
                        const newFilters = { ...searchFilters }
                        delete newFilters.state
                        setSearchFilters(newFilters)
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">Error loading institutions. Please try again.</p>
            </CardContent>
          </Card>
        ) : institutions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No institutions found.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {institutions.map((institution: any) => (
                <Card key={institution.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="line-clamp-2">{formatInstitutionName(institution.name)}</span>
                        </CardTitle>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{institution.type}</Badge>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{institution.ownership}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{institution.city}, {institution.state}</span>
                      </div>
                      {institution.website && (
                        <div className="flex items-center gap-2 text-xs">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <a
                            href={institution.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {institution.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                      {(institution.tuitionFees || institution.feesSchedule) && (
                        <Link href={`/institutions/${institution.id}#fees`}>
                          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer group">
                            <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="font-medium">Fees schedule available</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </Link>
                      )}
                      {institution.dataQualityScore !== undefined && (
                        <div className="pt-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Data Quality</span>
                            <span className="font-medium text-xs">{institution.dataQualityScore}/100</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${institution.dataQualityScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="pt-2 flex gap-2">
                        <Link href={`/institutions/${institution.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8">
                            View Details
                          </Button>
                        </Link>
                        {(institution.tuitionFees || institution.feesSchedule) && (
                          <Link href={`/institutions/${institution.id}#fees`} className="flex-1">
                            <Button variant="default" size="sm" className="w-full text-xs h-8">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Fees
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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
      </main>
      <Footer />
    </div>
  )
}
