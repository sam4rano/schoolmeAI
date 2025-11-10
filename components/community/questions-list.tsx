"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, Eye, ArrowUp, CheckCircle2, Tag } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Question {
  id: string
  title: string
  content: string
  status: string
  views: number
  upvotes: number
  tags: string[]
  bestAnswerId: string | null
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
  _count: {
    answers: number
  }
}

export function QuestionsList() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchQuestions()
  }, [page])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community/questions?page=${page}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setQuestions((prev) => (page === 1 ? data.data : [...prev, ...data.data]))
        setHasMore(data.pagination.page < data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && questions.length === 0) {
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

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No questions yet.</p>
          <Link href="/community/questions/new">
            <Button>Ask First Question</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/community/questions/${question.id}`}>
                    <CardTitle className="hover:text-primary transition-colors">
                      {question.title}
                    </CardTitle>
                  </Link>
                  {question.bestAnswerId && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <CardDescription className="line-clamp-2 mb-3">
                  {question.content}
                </CardDescription>
                {question.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {(question.institution || question.program) && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {question.institution && <span>{question.institution.name}</span>}
                    {question.institution && question.program && <span> • </span>}
                    {question.program && <span>{question.program.name}</span>}
                  </div>
                )}
              </div>
              <Badge variant={question.status === "resolved" ? "default" : "outline"}>
                {question.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>By {question.user.profile?.name || question.user.email}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{question.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  <span>{question._count.answers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" />
                  <span>{question.upvotes}</span>
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

