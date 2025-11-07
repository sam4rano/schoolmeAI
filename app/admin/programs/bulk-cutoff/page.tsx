"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { Upload, Loader2, FileText, CheckCircle2, AlertCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function BulkCutoffPage() {
  const { toast } = useToast()
  const [jsonData, setJsonData] = useState("")
  const [results, setResults] = useState<any>(null)

  const bulkCutoffMutation = useMutation({
    mutationFn: async (data: string) => {
      const parsed = JSON.parse(data)
      const response = await fetch("/api/admin/programs/bulk-cutoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates: parsed }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update cutoffs")
      }
      return response.json()
    },
    onSuccess: (data) => {
      setResults(data.data)
      toast({
        title: "Success",
        description: `Updated ${data.data.success} programs successfully`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = () => {
    if (!jsonData.trim()) {
      toast({
        title: "Error",
        description: "Please provide JSON data",
        variant: "destructive",
      })
      return
    }

    try {
      JSON.parse(jsonData)
      bulkCutoffMutation.mutate(jsonData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      })
    }
  }

  const exampleData = `[
  {
    "programId": "program-uuid-here",
    "cutoffHistory": [
      {
        "year": 2024,
        "cutoff": 250,
        "admissionMode": "UTME",
        "confidence": "verified",
        "sourceUrl": "https://example.com/cutoff"
      },
      {
        "year": 2023,
        "cutoff": 245,
        "admissionMode": "UTME",
        "confidence": "estimated"
      }
    ]
  }
]`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Bulk Cutoff Entry</h1>
        <p className="text-muted-foreground mt-2">
          Add or update cutoff data for multiple programs at once
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Cutoff Update
            </CardTitle>
            <CardDescription>
              Paste JSON data with program IDs and cutoff history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jsonData">JSON Data</Label>
              <Textarea
                id="jsonData"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder={exampleData}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={bulkCutoffMutation.isPending || !jsonData.trim()}
              className="w-full"
            >
              {bulkCutoffMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Update Cutoffs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Format</h4>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`[
  {
    "programId": "uuid",
    "cutoffHistory": [
      {
        "year": 2024,
        "cutoff": 250,
        "admissionMode": "UTME",
        "confidence": "verified",
        "sourceUrl": "https://..."
      }
    ]
  }
]`}
              </pre>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Program ID</p>
                  <p className="text-muted-foreground">
                    Get program IDs from the programs list or export
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Cutoff History</p>
                  <p className="text-muted-foreground">
                    New entries will merge with existing data. Same year entries will be updated.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Confidence Levels</p>
                  <p className="text-muted-foreground">
                    Use &quot;verified&quot; for official data, &quot;estimated&quot; for calculated values, &quot;unverified&quot; for unconfirmed data
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Link href="/admin/programs?missingCutoff=true">
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  View Programs Missing Cutoffs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.errors > 0 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="default" className="text-sm">
                  Success: {results.success}
                </Badge>
                {results.errors > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    Errors: {results.errors}
                  </Badge>
                )}
              </div>
              {results.results && results.results.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Successful Updates:</h4>
                  <div className="space-y-1 text-sm">
                    {results.results.map((result: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>
                          Program {result.programId.slice(0, 8)}... - {result.cutoffEntriesAdded} entries added
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {results.errors && results.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-destructive">Errors:</h4>
                  <div className="space-y-1 text-sm">
                    {results.errors.map((error: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span>
                          Program {error.programId?.slice(0, 8) || "unknown"}... - {error.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

