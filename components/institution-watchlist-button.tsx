"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface InstitutionWatchlistButtonProps {
  institutionId: string
  className?: string
}

export function InstitutionWatchlistButton({ institutionId, className }: InstitutionWatchlistButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if institution is in watchlist
  const checkWatchlist = async () => {
    try {
      const response = await fetch("/api/watchlist/institutions")
      if (response.ok) {
        const data = await response.json()
        const inWatchlist = data.data?.some(
          (item: any) => item.institution?.id === institutionId
        )
        setIsInWatchlist(inWatchlist)
      }
    } catch (error) {
      console.error("Error checking watchlist:", error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session) {
      checkWatchlist()
    } else {
      setChecking(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, institutionId])

  const handleToggleWatchlist = async () => {
    if (status !== "authenticated") {
      router.push("/auth/signin?callbackUrl=/institutions/" + institutionId)
      return
    }

    setLoading(true)
    try {
      if (isInWatchlist) {
        // Remove from watchlist - need to find the watchlist item ID
        const response = await fetch("/api/watchlist/institutions")
        if (response.ok) {
          const data = await response.json()
          const item = data.data?.find(
            (item: any) => item.institution?.id === institutionId
          )
          if (item) {
            const deleteResponse = await fetch(`/api/watchlist/institutions/${item.id}`, {
              method: "DELETE",
            })
            if (deleteResponse.ok) {
              setIsInWatchlist(false)
            }
          }
        }
      } else {
        // Add to watchlist
        const response = await fetch("/api/watchlist/institutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ institutionId, priority: "medium" }),
        })
        if (response.ok) {
          setIsInWatchlist(true)
        }
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || checking) {
    return (
      <Button variant="outline" disabled className={className}>
        <Bookmark className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (status !== "authenticated") {
    return (
      <Link href={`/auth/signin?callbackUrl=/institutions/${institutionId}`}>
        <Button variant="outline" className={className}>
          <Bookmark className="mr-2 h-4 w-4" />
          Sign in to Add to Watchlist
        </Button>
      </Link>
    )
  }

  return (
    <Button
      variant={isInWatchlist ? "default" : "outline"}
      onClick={handleToggleWatchlist}
      disabled={loading}
      className={className}
    >
      {isInWatchlist ? (
        <>
          <BookmarkCheck className="mr-2 h-4 w-4" />
          In Watchlist
        </>
      ) : (
        <>
          <Bookmark className="mr-2 h-4 w-4" />
          Add to Watchlist
        </>
      )}
    </Button>
  )
}

