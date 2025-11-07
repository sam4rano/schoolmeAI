"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-destructive mb-4">Error</h1>
          <h2 className="text-2xl font-semibold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-8">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={reset}>Try Again</Button>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


