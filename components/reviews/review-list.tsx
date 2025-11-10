"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "./star-rating"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Loader2, ThumbsUp, Flag, Trash2, Edit } from "lucide-react"
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
import { ReviewForm } from "./review-form"

interface Review {
  id: string
  userId: string
  rating: number
  title?: string
  content: string
  status: string
  helpfulCount: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    profile?: any
  }
}

interface ReviewListProps {
  entityType: "institution" | "program"
  entityId: string
}

export function ReviewList({ entityType, entityId }: ReviewListProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [averageRating, setAverageRating] = useState(0)
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/reviews?entityType=${entityType}&entityId=${entityId}&sortBy=${sortBy}&page=${page}&limit=10`
      )
      if (!response.ok) throw new Error("Failed to fetch reviews")
      const data = await response.json()
      setReviews(data.data)
      setTotalPages(data.meta.totalPages)
      setAverageRating(data.meta.averageRating || 0)
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
  }, [entityType, entityId, sortBy, page, toast])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to mark as helpful")
      fetchReviews()
      toast({
        title: "Success",
        description: "Marked as helpful",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as helpful",
        variant: "destructive",
      })
    }
  }

  const handleReport = async (reviewId: string) => {
    const reason = prompt("Please provide a reason for reporting this review:")
    if (!reason || reason.length < 5) {
      toast({
        title: "Invalid Reason",
        description: "Please provide a valid reason (at least 5 characters).",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) throw new Error("Failed to report review")
      toast({
        title: "Success",
        description: "Review reported. It will be reviewed by moderators.",
      })
      fetchReviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report review",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete review")
      toast({
        title: "Success",
        description: "Review deleted",
      })
      fetchReviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      })
    }
  }

  const getUserName = (user: Review["user"]) => {
    if (user.profile?.name) return user.profile.name
    return user.email.split("@")[0]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Reviews</h3>
          {averageRating > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(averageRating)} size="sm" />
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} out of 5 ({reviews.length} reviews)
              </span>
            </div>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="rating">Highest Rating</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        {review.title && (
                          <CardTitle className="text-base">{review.title}</CardTitle>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by {getUserName(review.user)} •{" "}
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {session?.user?.id === review.userId && (
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Review</DialogTitle>
                              <DialogDescription>
                                Update your review. It will be re-moderated.
                              </DialogDescription>
                            </DialogHeader>
                            <ReviewForm
                              entityType={entityType}
                              entityId={entityId}
                              existingReview={{
                                id: review.id,
                                rating: review.rating,
                                title: review.title,
                                content: review.content,
                              }}
                              onSuccess={() => {
                                setEditingReview(null)
                                fetchReviews()
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{review.content}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(review.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Helpful ({review.helpfulCount})
                    </Button>
                    {session?.user?.id !== review.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReport(review.id)}
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

