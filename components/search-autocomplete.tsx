"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { usePrograms } from "@/lib/hooks/use-programs"
import { useInstitutions } from "@/lib/hooks/use-institutions"
import { Search, GraduationCap, Building2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchAutocompleteProps {
  placeholder?: string
  className?: string
  onSelect?: () => void
  showResults?: boolean
}

export function SearchAutocomplete({
  placeholder = "Search institutions, programs, or courses...",
  className = "",
  onSelect,
  showResults = true,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch suggestions
  const { data: programsData } = usePrograms({
    query: debouncedQuery || undefined,
    limit: 5,
  })

  const { data: institutionsData } = useInstitutions({
    query: debouncedQuery || undefined,
    limit: 5,
  })

  const programs = programsData?.data || []
  const institutions = institutionsData?.data || []
  const suggestions = [
    ...institutions.map((inst: any) => ({ ...inst, type: "institution" })),
    ...programs.map((prog: any) => ({ ...prog, type: "program" })),
  ].slice(0, 8)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocusedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[focusedIndex])
    } else if (e.key === "Escape") {
      setShowDropdown(false)
      setFocusedIndex(-1)
    }
  }

  const handleSelect = (item: any) => {
    if (item.type === "institution") {
      router.push(`/institutions/${item.id}`)
    } else {
      router.push(`/programs/${item.id}`)
    }
    setQuery("")
    setShowDropdown(false)
    setFocusedIndex(-1)
    onSelect?.()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowDropdown(true)
    setFocusedIndex(-1)
  }

  const handleInputFocus = () => {
    if (query && suggestions.length > 0) {
      setShowDropdown(true)
    }
  }

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery("")
      setShowDropdown(false)
      onSelect?.()
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`} role="search">
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          onKeyPress={(e) => {
            if (e.key === "Enter" && focusedIndex === -1) {
              handleSearch()
            }
          }}
          className="pl-10 pr-10"
          aria-label="Search institutions, programs, or courses"
          aria-autocomplete="list"
          aria-controls={showDropdown && suggestions.length > 0 ? "search-results" : undefined}
          aria-expanded={showDropdown && suggestions.length > 0}
          aria-activedescendant={focusedIndex >= 0 ? `search-result-${focusedIndex}` : undefined}
          role="combobox"
        />
        {query && (
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Search"
            type="button"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && query && showResults && (
        <div
          id="search-results"
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-96 overflow-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>No results found for &quot;{query}&quot;</p>
              <button
                onClick={handleSearch}
                className="mt-2 text-primary hover:underline"
                aria-label={`View all search results for ${query}`}
                type="button"
              >
                View all search results →
              </button>
            </div>
          ) : (
            <div className="p-1">
              {suggestions.map((item: any, index: number) => (
                <button
                  key={`${item.type}-${item.id}`}
                  id={`search-result-${index}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-full text-left p-3 rounded-sm transition-colors ${
                    focusedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  role="option"
                  aria-selected={focusedIndex === index}
                  tabIndex={-1}
                  type="button"
                >
                  <div className="flex items-start gap-2">
                    {item.type === "institution" ? (
                      <Building2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    ) : (
                      <GraduationCap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.type === "program" && item.institution && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {item.institution.name}
                        </p>
                      )}
                      {item.type === "institution" && (
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {item.type}
                          </span>
                          {item.state && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {item.state}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {query && (
                <div className="border-t mt-1 pt-1">
                  <button
                    onClick={handleSearch}
                    className="w-full text-left p-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      View all results for &quot;{query}&quot;
                    </span>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

