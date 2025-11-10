"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AccreditationImportPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [propagateLoading, setPropagateLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [propagateResults, setPropagateResults] = useState<any>(null)

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

      const response = await fetch("/api/admin/accreditation/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import accreditation data")
      }

      const result = await response.json()
      setResults(result.results)

      toast({
        title: "Success",
        description: result.message || "Accreditation data imported successfully",
      })
    } catch (error) {
      console.error("Error importing accreditation data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import accreditation data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePropagate = async () => {
    setPropagateLoading(true)
    setPropagateResults(null)

    try {
      const response = await fetch("/api/admin/accreditation/propagate", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to propagate accreditation")
      }

      const result = await response.json()
      setPropagateResults(result.results)

      toast({
        title: "Success",
        description: result.message || "Accreditation propagated successfully",
      })
    } catch (error) {
      console.error("Error propagating accreditation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to propagate accreditation",
        variant: "destructive",
      })
    } finally {
      setPropagateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Accreditation Data Import</h1>
        <p className="text-muted-foreground mt-2">
          Upload NUC accreditation data to update program accreditation status and maturity dates
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>CSV Format Required:</strong> The CSV file should have columns: University, Faculty, Program, Latest_Status, Maturity_Date.
          <br />
          <strong>Re-accreditation Logic:</strong> Programs with maturity year &ge; 2024 are considered re-accredited.
          <br />
          <strong>Fuzzy Matching:</strong> The system will match programs even if names have changed slightly.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload Accreditation CSV</CardTitle>
          <CardDescription>
            Upload NUC accreditation results CSV file to update program accreditation data
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

          <div className="flex gap-2">
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
                  Import Accreditation Data
                </>
              )}
            </Button>
            <Button
              onClick={handlePropagate}
              disabled={propagateLoading}
              variant="outline"
              type="button"
            >
              {propagateLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Propagating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Propagate Institution Accreditation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>Summary of the accreditation data import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Info className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Renamed</p>
                  <p className="text-2xl font-bold">{results.renamed}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Discontinued</p>
                  <p className="text-2xl font-bold">{results.discontinued}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Errors</p>
                  <p className="text-2xl font-bold">{results.errors.length}</p>
                </div>
              </div>
            </div>

            {results.unmatched && results.unmatched.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Unmatched Programs ({results.unmatched.length})</p>
                <div className="max-h-48 overflow-y-auto rounded-lg border p-3">
                  {results.unmatched.slice(0, 10).map((item: any, index: number) => (
                    <div key={index} className="text-sm py-1 border-b last:border-0">
                      <span className="font-medium">{item.university}</span> - {item.program}
                      <span className="text-muted-foreground text-xs ml-2">({item.reason})</span>
                    </div>
                  ))}
                  {results.unmatched.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ... and {results.unmatched.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

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

      {propagateResults && (
        <Card>
          <CardHeader>
            <CardTitle>Propagation Results</CardTitle>
            <CardDescription>Summary of institution accreditation propagation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Institutions Processed</p>
                  <p className="text-2xl font-bold">{propagateResults.institutions}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Programs Updated</p>
                  <p className="text-2xl font-bold">{propagateResults.programsUpdated}</p>
                </div>
              </div>
            </div>

            {propagateResults.errors && propagateResults.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Errors ({propagateResults.errors.length})</p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-destructive/50 p-3">
                  {propagateResults.errors.slice(0, 10).map((error: string, index: number) => (
                    <div key={index} className="text-sm text-destructive py-1">
                      {error}
                    </div>
                  ))}
                  {propagateResults.errors.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ... and {propagateResults.errors.length - 10} more errors
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

