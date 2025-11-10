"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, FileText, CheckCircle2, AlertCircle, Info, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function InstitutionsImportPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/institutions/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import institutions")
      }

      const result = await response.json()
      setResults(result.results)

      toast({
        title: "Success",
        description: result.message || "Institutions imported successfully",
      })
    } catch (error) {
      console.error("Error importing institutions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import institutions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Institutions Import</h1>
        <p className="text-muted-foreground mt-2">
          Upload institutions CSV file to update or add institutions to the database
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>CSV Format Required:</strong> The CSV file should have columns: Name, Type, Ownership, State, City, Website, Accreditation Status, Email, Phone, Address, Source URL, License.
          <br />
          <strong>Update Logic:</strong> Institutions are matched by name and state. If found, they are updated; otherwise, new institutions are created.
          <br />
          <strong>Download Template:</strong> You can download the current institutions CSV from the csv_folder directory.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload Institutions CSV</CardTitle>
          <CardDescription>
            Upload CSV file to import or update institutions in the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{file.name}</span>
                <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Institutions
                </>
              )}
            </Button>
            <Link href="/api/institutions/export" target="_blank">
              <Button variant="outline" type="button">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>Summary of the institutions import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Matched</p>
                  <p className="text-2xl font-bold">{results.matched}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Updated</p>
                  <p className="text-2xl font-bold">{results.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-2xl font-bold">{results.created}</p>
                </div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Errors ({results.errors.length})</p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-destructive/50 p-3">
                  {results.errors.slice(0, 10).map((error: string, index: number) => (
                    <div key={index} className="text-sm text-destructive py-1">
                      {error}
                    </div>
                  ))}
                  {results.errors.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ... and {results.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

