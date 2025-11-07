"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, Building2, GraduationCap } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function EmbeddingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

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
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64">
        <div className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">AI Embeddings Management</h1>
            <p className="text-muted-foreground mt-2">
              Generate embeddings for institutions and programs to improve AI chat responses
            </p>
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
      </div>
    </div>
  )
}

