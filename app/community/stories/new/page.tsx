"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function NewStoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    institutionId: "",
    programId: "",
    utmeScore: "",
    admissionYear: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in title and content",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/community/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          institutionId: formData.institutionId || undefined,
          programId: formData.programId || undefined,
          utmeScore: formData.utmeScore ? parseInt(formData.utmeScore) : undefined,
          admissionYear: formData.admissionYear ? parseInt(formData.admissionYear) : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Story submitted successfully. It will be reviewed before publishing.",
        })
        router.push("/community")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to submit story",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Link href="/community" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Share Your Success Story</CardTitle>
            <CardDescription>Inspire others by sharing your admission journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Story Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your story a title"
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Your Story</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share your admission journey, challenges, and success..."
                  rows={12}
                  maxLength={10000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.content.length} / 10000 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utmeScore">UTME Score (Optional)</Label>
                  <Input
                    id="utmeScore"
                    type="number"
                    min="0"
                    max="400"
                    value={formData.utmeScore}
                    onChange={(e) => setFormData({ ...formData, utmeScore: e.target.value })}
                    placeholder="e.g., 280"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionYear">Admission Year (Optional)</Label>
                  <Input
                    id="admissionYear"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.admissionYear}
                    onChange={(e) => setFormData({ ...formData, admissionYear: e.target.value })}
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Your story will be reviewed by moderators before being published. 
                  This helps maintain quality and ensure all stories are appropriate.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Story
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

