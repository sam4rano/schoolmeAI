"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
// Import SwaggerUI CSS at top level
import "swagger-ui-react/swagger-ui.css"

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Loading API documentation...</p>
    </div>
  ),
})

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => {
        setSpec(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading API documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-destructive">Error loading API documentation: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground">
          Complete API documentation for SchoolMe platform
        </p>
      </div>
      {spec && <SwaggerUI spec={spec} />}
    </div>
  )
}

