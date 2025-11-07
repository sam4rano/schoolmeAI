"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function BulkFeesPage() {
  const { toast } = useToast()
  const [jsonData, setJsonData] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "Error",
        description: "Please provide JSON data",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const data = JSON.parse(jsonData)
      
      const response = await fetch("/api/admin/programs/bulk-fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import fees")
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: `Successfully updated fees for ${result.updated} programs/institutions`,
      })
      
      setJsonData("")
    } catch (error) {
      console.error("Error importing fees:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import fees",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exampleData = {
    programs: [
      {
        id: "program-uuid",
        tuitionFees: {
          amount: 50000,
          currency: "NGN",
          per_year: true,
          breakdown: {
            tuition: 40000,
            registration: 5000,
            development: 5000,
          },
        },
      },
    ],
    institutions: [
      {
        id: "institution-uuid",
        tuitionFees: {
          schedule: [
            {
              program: "Computer Science",
              level: "100",
              amount: 50000,
              currency: "NGN",
              per_year: true,
            },
          ],
          lastUpdated: "2024-01-01",
          source: "Official website",
        },
      },
    ],
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64">
        <div className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Bulk Fee Entry</h1>
            <p className="text-muted-foreground mt-2">
              Import fee information for multiple programs and institutions at once
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Import Fee Data</CardTitle>
              <CardDescription>
                Paste JSON data with fee information for programs and institutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder="Paste JSON data here..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={loading || !jsonData.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Fees
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setJsonData(JSON.stringify(exampleData, null, 2))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Load Example
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Format Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold mb-2">JSON Format:</p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(exampleData, null, 2)}
                </pre>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Use program/institution IDs from your database. 
                  The system will update existing records or skip if not found.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

