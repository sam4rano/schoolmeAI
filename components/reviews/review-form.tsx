"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "./star-rating"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface ReviewFormProps {
  entityType: "institution" | "program"
  entityId: string
  onSuccess?: () => void
  onCancel?: () => void
  existingReview?: {
    id: string
    rating: number
    title?: string
    content: string
  }
}

export function ReviewForm({
  entityType,
  entityId,
  onSuccess,
  onCancel,
  existingReview,
}: ReviewFormProps) {
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || "")
  const [content, setContent] = useState(existingReview?.content || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (status !== "authenticated" || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a review.",
        variant: "destructive",
      })
      return
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating.",
        variant: "destructive",
      })
      return
    }

    if (content.length < 10) {
      toast({
        title: "Content Too Short",
        description: "Please write at least 10 characters.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const url = existingReview
        ? `/api/reviews/${existingReview.id}`
        : "/api/reviews"
      const method = existingReview ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          entityId,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit review")
      }

      toast({
        title: "Success",
        description: existingReview
          ? "Review updated successfully. It will be re-moderated."
          : "Review submitted successfully. It will be published after moderation.",
      })

      setRating(0)
      setTitle("")
      setContent("")
      onSuccess?.()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Please sign in to submit a review.
        </p>
        <Link href={`/auth/signin?callbackUrl=/programs/${entityId}`}>
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Rating <span className="text-destructive">*</span>
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
        {rating > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {rating} out of 5 stars
          </p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title (Optional)
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your review a title"
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Review <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience..."
          rows={5}
          minLength={10}
          maxLength={2000}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {content.length} / 2000 characters (minimum 10)
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || rating === 0 || content.length < 10}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : existingReview ? (
            "Update Review"
          ) : (
            "Submit Review"
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

