"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/reviews/star-rating"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, X, Flag, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Review {
  id: string
  userId: string
  entityType: string
  entityId: string
  institutionId?: string
  programId?: string
  rating: number
  title?: string
  content: string
  status: string
  helpfulCount: number
  reportedCount: number
  moderationNotes?: string
  moderatedBy?: string
  moderatedAt?: string
  createdAt: string
  user: {
    id: string
    email: string
    profile?: any
  }
}

export default function AdminReviewsPage() {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [moderatingReview, setModeratingReview] = useState<Review | null>(null)
  const [moderationStatus, setModerationStatus] = useState<"approved" | "rejected" | "flagged">("approved")
  const [moderationNotes, setModerationNotes] = useState("")

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/reviews?${params.toString()}&limit=50`)
      if (!response.ok) throw new Error("Failed to fetch reviews")
      const data = await response.json()
      setReviews(data.data)
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, toast])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleModerate = async () => {
    if (!moderatingReview) return

    try {
      const response = await fetch(`/api/reviews/${moderatingReview.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: moderationStatus,
          moderationNotes: moderationNotes.trim() || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to moderate review")

      toast({
        title: "Success",
        description: "Review moderated successfully",
      })

      setModeratingReview(null)
      setModerationNotes("")
      fetchReviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to moderate review",
        variant: "destructive",
      })
    }
  }

  const getUserName = (user: Review["user"]) => {
    if (user.profile?.name) return user.profile.name
    return user.email.split("@")[0]
  }

  const filteredReviews = reviews.filter((review) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      review.content.toLowerCase().includes(query) ||
      review.title?.toLowerCase().includes(query) ||
      review.user.email.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Moderation</h1>
        <p className="text-muted-foreground">
          Moderate user reviews for institutions and programs
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
      </div>

      {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No reviews found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        {review.title && (
                          <CardTitle className="text-base">{review.title}</CardTitle>
                        )}
                        <Badge
                          variant={
                            review.status === "approved"
                              ? "default"
                              : review.status === "rejected"
                              ? "destructive"
                              : review.status === "flagged"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {review.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by {getUserName(review.user)} •{" "}
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })} •{" "}
                        {review.entityType === "program" ? "Program" : "Institution"}
                      </p>
                      {review.reportedCount > 0 && (
                        <Badge variant="outline" className="mt-1">
                          <Flag className="h-3 w-3 mr-1" />
                          {review.reportedCount} reports
                        </Badge>
                      )}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setModeratingReview(review)
                            setModerationStatus(
                              review.status === "approved"
                                ? "approved"
                                : review.status === "rejected"
                                ? "rejected"
                                : "approved"
                            )
                            setModerationNotes(review.moderationNotes || "")
                          }}
                        >
                          Moderate
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Moderate Review</DialogTitle>
                          <DialogDescription>
                            Review the content and decide on moderation action
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Review Content</p>
                            <div className="rounded-lg border p-4 bg-muted">
                              <div className="flex items-center gap-2 mb-2">
                                <StarRating rating={review.rating} size="sm" />
                                {review.title && (
                                  <span className="font-medium">{review.title}</span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{review.content}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Moderation Status
                            </label>
                            <Select
                              value={moderationStatus}
                              onValueChange={(value: "approved" | "rejected" | "flagged") =>
                                setModerationStatus(value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="approved">Approve</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                                <SelectItem value="flagged">Flag</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Moderation Notes (Optional)
                            </label>
                            <Textarea
                              value={moderationNotes}
                              onChange={(e) => setModerationNotes(e.target.value)}
                              placeholder="Add notes about this moderation decision..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                handleModerate()
                                setModeratingReview(null)
                                setModerationNotes("")
                              }}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Apply Moderation
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setModeratingReview(null)
                                setModerationNotes("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{review.content}</p>
                  {review.moderationNotes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted">
                      <p className="text-xs font-medium mb-1">Moderation Notes</p>
                      <p className="text-xs text-muted-foreground">{review.moderationNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

