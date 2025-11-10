"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Eye, Heart, Star } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface UserStory {
  id: string
  title: string
  content: string
  featured: boolean
  views: number
  likes: number
  utmeScore: number | null
  admissionYear: number | null
  createdAt: string
  user: {
    id: string
    email: string
    profile: any
  }
  institution?: {
    id: string
    name: string
  }
  program?: {
    id: string
    name: string
  }
}

export function StoriesList() {
  const [stories, setStories] = useState<UserStory[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [page])

  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community/stories?page=${page}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setStories((prev) => (page === 1 ? data.data : [...prev, ...data.data]))
        setHasMore(data.pagination.page < data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching stories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && stories.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full animate-pulse mb-2" />
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No success stories yet.</p>
          <Link href="/community/stories/new">
            <Button>Share Your Story</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <Card key={story.id} className={`hover:shadow-md transition-shadow ${story.featured ? "border-2 border-primary" : ""}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {story.featured && (
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  )}
                  <Link href={`/community/stories/${story.id}`}>
                    <CardTitle className="hover:text-primary transition-colors">
                      {story.title}
                    </CardTitle>
                  </Link>
                </div>
                <CardDescription className="line-clamp-3 mb-3">
                  {story.content}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {story.institution && (
                    <span>{story.institution.name}</span>
                  )}
                  {story.program && (
                    <>
                      {story.institution && <span>•</span>}
                      <span>{story.program.name}</span>
                    </>
                  )}
                  {story.utmeScore && (
                    <>
                      {(story.institution || story.program) && <span>•</span>}
                      <span>UTME: {story.utmeScore}</span>
                    </>
                  )}
                  {story.admissionYear && (
                    <>
                      <span>•</span>
                      <span>Admitted: {story.admissionYear}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>By {story.user.profile?.name || story.user.email}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{story.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{story.likes}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}

