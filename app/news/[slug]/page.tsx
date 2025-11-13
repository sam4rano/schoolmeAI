"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { NewsCard } from "@/components/news/news-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowLeft, Calendar, Eye, User, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Badge } from "@/components/ui/badge"

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  category: string
  status: string
  featured?: boolean
  imageUrl?: string | null
  sourceUrl?: string | null
  tags?: string[]
  views?: number
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    email: string
    profile?: any
  } | null
}

const categoryColors: Record<string, string> = {
  jamb: "bg-blue-500",
  post_utme: "bg-purple-500",
  nursing_schools: "bg-pink-500",
  admission: "bg-green-500",
  nysc: "bg-orange-500",
  general: "bg-gray-500",
  scholarships: "bg-yellow-500",
  cutoff_updates: "bg-red-500",
  accreditation: "bg-indigo-500",
}

const categoryLabels: Record<string, string> = {
  jamb: "JAMB",
  post_utme: "Post UTME",
  nursing_schools: "Nursing Schools",
  admission: "Admission",
  nysc: "NYSC",
  general: "General",
  scholarships: "Scholarships",
  cutoff_updates: "Cutoff Updates",
  accreditation: "Accreditation",
}

export default function NewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([])

  const fetchArticle = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/news/${slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("News article not found")
        }
        throw new Error("Failed to fetch news article")
      }

      const data = await response.json()
      setArticle(data.data)

      // Fetch related news
      if (data.data.category) {
        const relatedResponse = await fetch(
          `/api/news?category=${data.data.category}&limit=3&page=1`
        )
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json()
          setRelatedNews(
            relatedData.data.filter((item: NewsArticle) => item.slug !== slug)
          )
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchArticle()
  }, [fetchArticle])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              {error || "News article not found"}
            </p>
            <Button onClick={() => router.push("/news")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const categoryColor = categoryColors[article.category] || "bg-gray-500"
  const categoryLabel = categoryLabels[article.category] || article.category
  const formattedDate = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })
  const authorName = article.author?.profile?.name || article.author?.email?.split("@")[0] || "Admin"

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <Button
          onClick={() => router.push("/news")}
          variant="ghost"
          className="mb-4"
          aria-label="Back to news"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to News
        </Button>

        <article>
          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={categoryColor} variant="default">
                {categoryLabel}
              </Badge>
              {article.featured && (
                <Badge variant="default">Featured</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-4">{article.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {formattedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
              )}
              {article.views !== undefined && article.views > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.views} views</span>
                </div>
              )}
              {article.author && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{authorName}</span>
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {article.imageUrl && (
            <div className="mb-8 relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-2">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Source Link */}
          {article.sourceUrl && (
            <div className="mb-8">
              <Button
                asChild
                variant="outline"
                aria-label="View original source"
              >
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original Source
                </a>
              </Button>
            </div>
          )}
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related News</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedNews.map((item) => (
                <NewsCard key={item.id} {...item} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

