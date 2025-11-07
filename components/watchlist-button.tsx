"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface WatchlistButtonProps {
  programId: string
  className?: string
}

export function WatchlistButton({ programId, className }: WatchlistButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if program is in watchlist
  const checkWatchlist = async () => {
    try {
      const response = await fetch("/api/watchlist")
      if (response.ok) {
        const data = await response.json()
        const inWatchlist = data.data?.some(
          (item: any) => item.program?.id === programId
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
  }, [session, status, programId])

  const handleToggleWatchlist = async () => {
    if (status !== "authenticated") {
      router.push("/auth/signin?callbackUrl=/programs/" + programId)
      return
    }

    setLoading(true)
    try {
      if (isInWatchlist) {
        // Remove from watchlist - need to find the watchlist item ID
        const response = await fetch("/api/watchlist")
        if (response.ok) {
          const data = await response.json()
          const item = data.data?.find(
            (item: any) => item.program?.id === programId
          )
          if (item) {
            const deleteResponse = await fetch(`/api/watchlist/${item.id}`, {
              method: "DELETE",
            })
            if (deleteResponse.ok) {
              setIsInWatchlist(false)
            }
          }
        }
      } else {
        // Add to watchlist
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId, priority: "medium" }),
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
      <Link href={`/auth/signin?callbackUrl=/programs/${programId}`}>
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

