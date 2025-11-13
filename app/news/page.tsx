"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { NewsCard } from "@/components/news/news-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Search, Filter } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  category: string
  featured?: boolean
  imageUrl?: string | null
  tags?: string[]
  views?: number
  publishedAt?: string | null
  author?: {
    id: string
    email: string
    profile?: any
  } | null
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "jamb", label: "JAMB" },
  { value: "post_utme", label: "Post UTME" },
  { value: "nursing_schools", label: "Nursing Schools" },
  { value: "admission", label: "Admission" },
  { value: "nysc", label: "NYSC" },
  { value: "scholarships", label: "Scholarships" },
  { value: "cutoff_updates", label: "Cutoff Updates" },
  { value: "accreditation", label: "Accreditation" },
  { value: "general", label: "General" },
]

export default function NewsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [featured, setFeatured] = useState(searchParams.get("featured") === "true")

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category !== "all") params.append("category", category)
      if (search) params.append("search", search)
      if (featured) params.append("featured", "true")
      params.append("page", page.toString())
      params.append("limit", "12")

      const response = await fetch(`/api/news?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch news")
      }

      const data = await response.json()
      setNews(data.data)
      setTotalPages(data.meta.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [page, category, search, featured])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    const params = new URLSearchParams()
    if (category !== "all") params.append("category", category)
    if (search) params.append("search", search)
    if (featured) params.append("featured", "true")
    router.push(`/news?${params.toString()}`)
    fetchNews()
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setPage(1)
    const params = new URLSearchParams()
    if (value !== "all") params.append("category", value)
    if (search) params.append("search", search)
    if (featured) params.append("featured", "true")
    router.push(`/news?${params.toString()}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Latest News</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest news about JAMB, Post UTME, admissions, NYSC, and more.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search news..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
                aria-label="Search news articles"
              />
            </div>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[200px]" aria-label="Filter by category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" aria-label="Search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              type="button"
              variant={featured ? "default" : "outline"}
              onClick={() => {
                setFeatured(!featured)
                setPage(1)
              }}
              aria-label={featured ? "Show all news" : "Show featured news only"}
            >
              <Filter className="h-4 w-4 mr-2" />
              Featured
            </Button>
          </form>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading news</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No news articles found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article) => (
                <NewsCard key={article.id} {...article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

