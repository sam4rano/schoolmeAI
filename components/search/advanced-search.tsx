"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, X, ChevronDown, ChevronUp, History, Bookmark, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { NIGERIAN_STATES_WITH_ABUJA } from "@/lib/constants/nigerian-states"

interface AdvancedSearchProps {
  type: "programs" | "institutions"
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

export interface SearchFilters {
  query?: string
  // Institution filters
  type?: string
  ownership?: string
  state?: string
  // Program filters
  course?: string
  degreeType?: string
  institutionId?: string
  // Advanced filters
  accreditationStatus?: string
  cutoffMin?: number
  cutoffMax?: number
  feesMin?: number
  feesMax?: number
}

interface SavedSearch {
  id: string
  name: string
  filters: SearchFilters
  createdAt: string
}

export function AdvancedSearch({ type, onSearch, initialFilters }: AdvancedSearchProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {})
  const [searchHistory, setSearchHistory] = useState<SearchFilters[]>([])

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`${type}_search_history`)
      if (stored) {
        try {
          const history = JSON.parse(stored)
          setSearchHistory(Array.isArray(history) ? history.slice(0, 10) : [])
        } catch (error) {
          console.error("Error parsing search history:", error)
        }
      }
    }
  }, [type])

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])

  // Load saved searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && session?.user) {
      const stored = localStorage.getItem(`${type}_saved_searches`)
      if (stored) {
        try {
          const searches = JSON.parse(stored)
          setSavedSearches(Array.isArray(searches) ? searches : [])
        } catch (error) {
          console.error("Error parsing saved searches:", error)
        }
      }
    }
  }, [type, session?.user])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" || value === "all" ? undefined : value,
    }))
  }

  const handleSearch = () => {
    // Save to search history
    const history = [filters, ...searchHistory.filter((h) => JSON.stringify(h) !== JSON.stringify(filters))].slice(0, 10)
    setSearchHistory(history)
    localStorage.setItem(`${type}_search_history`, JSON.stringify(history))

    onSearch(filters)
  }

  const handleClearFilters = () => {
    setFilters({})
    onSearch({})
  }

  const handleLoadFromHistory = (historyFilters: SearchFilters) => {
    setFilters(historyFilters)
    onSearch(historyFilters)
  }

  const handleSaveSearch = () => {
    if (!session?.user) {
      alert("Please sign in to save searches")
      return
    }

    const name = prompt("Enter a name for this search:")
    if (!name) return

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    }

    const updated = [newSearch, ...savedSearches].slice(0, 10) // Keep max 10
    setSavedSearches(updated)
    localStorage.setItem(`${type}_saved_searches`, JSON.stringify(updated))
  }

  const handleDeleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem(`${type}_saved_searches`, JSON.stringify(updated))
  }

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-lg">Advanced Search</CardTitle>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CardContent>
          {/* Basic Search */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${type}...`}
                value={filters.query || ""}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
              />
            </div>

            <CollapsibleContent className="space-y-4">
              {/* Type-specific filters */}
              {type === "institutions" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Institution Type</Label>
                    <Select
                      value={filters.type || "all"}
                      onValueChange={(value) => handleFilterChange("type", value)}
                    >
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
                  </div>

                  <div className="space-y-2">
                    <Label>Ownership</Label>
                    <Select
                      value={filters.ownership || "all"}
                      onValueChange={(value) => handleFilterChange("ownership", value)}
                    >
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
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={filters.state || "all"}
                      onValueChange={(value) => handleFilterChange("state", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All States</SelectItem>
                        {NIGERIAN_STATES_WITH_ABUJA.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state === "FCT" ? "FCT (Abuja)" : state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {type === "programs" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Degree Type</Label>
                    <Select
                      value={filters.degreeType || "all"}
                      onValueChange={(value) => handleFilterChange("degreeType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Degree Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Degree Types</SelectItem>
                        <SelectItem value="BSc">BSc</SelectItem>
                        <SelectItem value="ND">ND</SelectItem>
                        <SelectItem value="HND">HND</SelectItem>
                        <SelectItem value="MBBS">MBBS</SelectItem>
                        <SelectItem value="LLB">LLB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Accreditation Status</Label>
                    <Select
                      value={filters.accreditationStatus || "all"}
                      onValueChange={(value) => handleFilterChange("accreditationStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Full">Fully Accredited</SelectItem>
                        <SelectItem value="Interim">Interim Accreditation</SelectItem>
                        <SelectItem value="Denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cutoff Range (Min)</Label>
                  <Input
                    type="number"
                    placeholder="Min cutoff"
                    value={filters.cutoffMin || ""}
                    onChange={(e) => handleFilterChange("cutoffMin", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cutoff Range (Max)</Label>
                  <Input
                    type="number"
                    placeholder="Max cutoff"
                    value={filters.cutoffMax || ""}
                    onChange={(e) => handleFilterChange("cutoffMax", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fees Range (Min - NGN)</Label>
                  <Input
                    type="number"
                    placeholder="Min fees"
                    value={filters.feesMin || ""}
                    onChange={(e) => handleFilterChange("feesMin", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fees Range (Max - NGN)</Label>
                  <Input
                    type="number"
                    placeholder="Max fees"
                    value={filters.feesMax || ""}
                    onChange={(e) => handleFilterChange("feesMax", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSearch} className="flex-1 sm:flex-initial">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                {session?.user && (
                  <Button variant="outline" onClick={handleSaveSearch}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save Search
                  </Button>
                )}
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">Recent Searches</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((history, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => handleLoadFromHistory(history)}
                      >
                        {history.query || "Filtered search"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">Saved Searches</Label>
                  </div>
                  <div className="space-y-2">
                    {savedSearches.map((saved) => (
                      <div key={saved.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                        <button
                          onClick={() => handleLoadFromHistory(saved.filters)}
                          className="flex-1 text-left text-sm"
                        >
                          {saved.name}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSavedSearch(saved.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  )
}

