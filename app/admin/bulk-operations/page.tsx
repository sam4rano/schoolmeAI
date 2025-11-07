"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

export default function BulkOperationsPage() {
  const { toast } = useToast()
  const [operation, setOperation] = useState<"import" | "export" | "update" | "delete">("import")
  const [file, setFile] = useState<File | null>(null)
  const [jsonData, setJsonData] = useState("")
  const [entityType, setEntityType] = useState<"institution" | "program">("institution")

  const importMutation = useMutation({
    mutationFn: async (data: { file?: File; json?: string; entityType: string }) => {
      const formData = new FormData()
      if (data.file) {
        formData.append("file", data.file)
      } else if (data.json) {
        formData.append("json", data.json)
      }
      formData.append("entityType", data.entityType)

      const response = await fetch("/api/admin/bulk/import", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import data")
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully imported ${data.data?.count || 0} ${entityType}s`,
      })
      setFile(null)
      setJsonData("")
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const exportMutation = useMutation({
    mutationFn: async (data: { entityType: string; format: "json" | "csv" }) => {
      const response = await fetch(`/api/admin/bulk/export?entityType=${data.entityType}&format=${data.format}`)
      if (!response.ok) throw new Error("Failed to export data")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${data.entityType}s.${data.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data exported successfully",
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

  const handleImport = () => {
    if (operation === "import") {
      if (!file && !jsonData.trim()) {
        toast({
          title: "Error",
          description: "Please provide a file or JSON data",
          variant: "destructive",
        })
        return
      }
      importMutation.mutate({ file: file || undefined, json: jsonData || undefined, entityType })
    }
  }

  const handleExport = (format: "json" | "csv") => {
    exportMutation.mutate({ entityType, format })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Bulk Operations</h1>
        <p className="text-muted-foreground mt-2">
          Import, export, or perform bulk operations on institutions and programs
        </p>
      </div>

      {/* Operation Type */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Type</CardTitle>
          <CardDescription>Select the type of bulk operation</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={operation} onValueChange={(value: any) => setOperation(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="import">Import Data</SelectItem>
              <SelectItem value="export">Export Data</SelectItem>
              <SelectItem value="update">Bulk Update</SelectItem>
              <SelectItem value="delete">Bulk Delete</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Entity Type */}
      <Card>
        <CardHeader>
          <CardTitle>Entity Type</CardTitle>
          <CardDescription>Select institutions or programs</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={entityType} onValueChange={(value: any) => setEntityType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="institution">Institutions</SelectItem>
              <SelectItem value="program">Programs</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Import */}
      {operation === "import" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload a JSON or CSV file, or paste JSON data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload File (JSON or CSV)</Label>
              <Input
                id="file"
                type="file"
                accept=".json,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jsonData">Or Paste JSON Data</Label>
              <Textarea
                id="jsonData"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder='[{"name": "Institution Name", "type": "university", ...}]'
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending || (!file && !jsonData.trim())}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {entityType}s
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Export */}
      {operation === "export" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Export institutions or programs to JSON or CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => handleExport("json")}
                disabled={exportMutation.isPending}
                variant="outline"
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export as JSON
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleExport("csv")}
                disabled={exportMutation.isPending}
                variant="outline"
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Update */}
      {operation === "update" && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Update</CardTitle>
            <CardDescription>
              Update multiple {entityType}s at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Bulk update functionality coming soon. Use individual edit pages for now.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Delete */}
      {operation === "delete" && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Delete</CardTitle>
            <CardDescription>
              Delete multiple {entityType}s at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Bulk delete functionality coming soon. Use individual delete actions for now.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Import Format (JSON)</h4>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`[
  {
    "name": "Institution Name",
    "type": "university",
    "ownership": "federal",
    "state": "Lagos",
    "city": "Lagos",
    "website": "https://example.com"
  }
]`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Notes</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>JSON files must be valid JSON arrays</li>
              <li>CSV files must have headers matching the entity fields</li>
              <li>Required fields must be present for each record</li>
              <li>Import will create new records or update existing ones based on matching criteria</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

