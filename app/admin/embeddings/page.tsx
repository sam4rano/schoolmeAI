"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, Building2, GraduationCap } from "lucide-react"

export default function EmbeddingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [embeddingCount, setEmbeddingCount] = useState<number | null>(null)

  // Check embedding count on mount
  useEffect(() => {
    const checkEmbeddings = async () => {
      try {
        const response = await fetch("/api/admin/embeddings/count")
        if (response.ok) {
          const data = await response.json()
          setEmbeddingCount(data.count)
        }
      } catch (error) {
        console.error("Error checking embeddings:", error)
      }
    }
    checkEmbeddings()
  }, [])

  const handleGenerate = async (type: "institution" | "program" | "all") => {
    setLoading(true)
    setGenerating(type)

    try {
      const response = await fetch("/api/admin/embeddings/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate embeddings")
      }

      const data = await response.json()
      
      toast({
        title: "Success",
        description: data.message + (data.count ? ` (${data.count} embeddings)` : data.total ? ` (${data.total} total)` : ""),
      })
      
      // Refresh embedding count
      const countResponse = await fetch("/api/admin/embeddings/count")
      if (countResponse.ok) {
        const countData = await countResponse.json()
        setEmbeddingCount(countData.count)
      }
    } catch (error) {
      console.error("Error generating embeddings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate embeddings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setGenerating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Embeddings Management</h1>
        <p className="text-muted-foreground mt-2">
          Generate embeddings for institutions and programs to improve AI chat responses
        </p>
            {embeddingCount !== null && (
              <div className="mt-4">
                <Badge variant={embeddingCount > 0 ? "default" : "destructive"}>
                  {embeddingCount} embeddings in database
                </Badge>
                {embeddingCount === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ⚠️ No embeddings found. Generate embeddings to enable AI chat responses.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Institution Embeddings
                </CardTitle>
                <CardDescription>
                  Generate embeddings for all institutions in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerate("institution")}
                  disabled={loading}
                  className="w-full"
                >
                  {generating === "institution" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Institution Embeddings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Program Embeddings
                </CardTitle>
                <CardDescription>
                  Generate embeddings for all programs in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerate("program")}
                  disabled={loading}
                  className="w-full"
                >
                  {generating === "program" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Program Embeddings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  All Embeddings
                </CardTitle>
                <CardDescription>
                  Generate embeddings for both institutions and programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleGenerate("all")}
                  disabled={loading}
                  className="w-full"
                >
                  {generating === "all" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Embeddings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>About Embeddings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What are embeddings?</h3>
                <p className="text-sm text-muted-foreground">
                  Embeddings are vector representations of text that allow the AI to understand and search through
                  your institution and program data. They enable the AI chat to answer questions about specific
                  institutions, programs, and admission requirements.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⚠️ Important: Generate Embeddings First</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Before the AI chat can answer questions, you must generate embeddings.</strong> The AI chat
                  will show &quot;I couldn&apos;t find information&quot; errors until embeddings are generated.
                </p>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Generate All Embeddings&quot; above to populate the knowledge base. This is required
                  for the AI chat to work properly.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">When to regenerate embeddings</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>After adding new institutions or programs</li>
                  <li>After updating institution or program details</li>
                  <li>After adding or updating cutoff history</li>
                  <li>If AI chat responses are inaccurate or missing information</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Note</h3>
                <p className="text-sm text-muted-foreground">
                  Generating embeddings may take several minutes depending on the number of institutions and programs
                  in your database. The process will continue in the background.
                </p>
              </div>
            </CardContent>
          </Card>
    </div>
  )
}

