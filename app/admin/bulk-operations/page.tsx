"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Loader2, FileText, CheckCircle2, AlertCircle, Trash2, Edit } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
      {operation === "update" && <BulkUpdateSection entityType={entityType} />}

      {/* Bulk Delete */}
      {operation === "delete" && <BulkDeleteSection entityType={entityType} />}

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

// Bulk Update Component
function BulkUpdateSection({ entityType }: { entityType: "institution" | "program" }) {
  const { toast } = useToast()
  const [jsonData, setJsonData] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const updateMutation = useMutation({
    mutationFn: async (data: { entityType: string; updates: Array<{ id: string; data: any }> }) => {
      const response = await fetch("/api/admin/bulk/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update data")
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully updated ${data.data?.updated || 0} ${entityType}s. ${data.data?.failed || 0} failed.`,
      })
      setJsonData("")
      setFile(null)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleUpdate = () => {
    if (!file && !jsonData.trim()) {
      toast({
        title: "Error",
        description: "Please provide a file or JSON data",
        variant: "destructive",
      })
      return
    }

    // Parse JSON data
    let updates: Array<{ id: string; data: any }> = []
    try {
      if (file) {
        // File will be read asynchronously
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string
            const parsed = JSON.parse(text)
            if (!Array.isArray(parsed)) {
              throw new Error("Data must be an array")
            }
            updates = parsed.map((item: any) => ({
              id: item.id,
              data: { ...item, id: undefined }, // Remove id from data
            }))
            updateMutation.mutate({ entityType, updates })
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to parse file",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      } else {
        const parsed = JSON.parse(jsonData)
        if (!Array.isArray(parsed)) {
          throw new Error("Data must be an array")
        }
        updates = parsed.map((item: any) => ({
          id: item.id,
          data: { ...item, id: undefined }, // Remove id from data
        }))
        updateMutation.mutate({ entityType, updates })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse JSON data",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Bulk Update
        </CardTitle>
        <CardDescription>
          Update multiple {entityType}s at once. Provide JSON with id and fields to update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="updateFile">Upload File (JSON)</Label>
          <Input
            id="updateFile"
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="updateJsonData">Or Paste JSON Data</Label>
          <Textarea
            id="updateJsonData"
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            placeholder={`[{"id": "uuid", "name": "New Name", "state": "New State", ...}]`}
            rows={10}
            className="font-mono text-sm"
          />
        </div>
        <div className="bg-muted p-4 rounded-md text-sm">
          <p className="font-semibold mb-2">Update Format:</p>
          <pre className="text-xs overflow-x-auto">
{`[
  {
    "id": "uuid-of-${entityType}",
    "name": "Updated Name",
    "state": "Updated State",
    ...
  }
]`}
          </pre>
          <p className="mt-2 text-muted-foreground">
            Only include fields you want to update. The id field is required for each item.
          </p>
        </div>
        <Button
          onClick={handleUpdate}
          disabled={updateMutation.isPending || (!file && !jsonData.trim())}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Update {entityType}s
            </>
          )}
        </Button>
        {updateMutation.data?.data?.errors && updateMutation.data.data.errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <p className="font-semibold text-destructive mb-2">Errors:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {updateMutation.data.data.errors.slice(0, 10).map((error: any, index: number) => (
                <li key={index}>
                  {error.id}: {error.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Bulk Delete Component
function BulkDeleteSection({ entityType }: { entityType: "institution" | "program" }) {
  const { toast } = useToast()
  const [idsInput, setIdsInput] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [idsToDelete, setIdsToDelete] = useState<string[]>([])

  const deleteMutation = useMutation({
    mutationFn: async (data: { entityType: string; ids: string[]; confirm: boolean }) => {
      const response = await fetch("/api/admin/bulk/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete data")
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully deleted ${data.data?.deleted || 0} ${entityType}s. ${data.data?.failed || 0} failed.`,
      })
      setIdsInput("")
      setConfirmDialogOpen(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setConfirmDialogOpen(false)
    },
  })

  const handleDeleteClick = () => {
    // Parse IDs from input (comma-separated or newline-separated)
    const ids = idsInput
      .split(/[,\n]/)
      .map(id => id.trim())
      .filter(id => id.length > 0)

    if (ids.length === 0) {
      toast({
        title: "Error",
        description: "Please provide at least one ID",
        variant: "destructive",
      })
      return
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validIds = ids.filter(id => uuidRegex.test(id))
    const invalidIds = ids.filter(id => !uuidRegex.test(id))

    if (invalidIds.length > 0) {
      toast({
        title: "Error",
        description: `Invalid IDs: ${invalidIds.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    if (validIds.length > 100) {
      toast({
        title: "Error",
        description: "Cannot delete more than 100 items at once",
        variant: "destructive",
      })
      return
    }

    setIdsToDelete(validIds)
    setConfirmDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteMutation.mutate({
      entityType,
      ids: idsToDelete,
      confirm: true,
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Bulk Delete
          </CardTitle>
          <CardDescription>
            Delete multiple {entityType}s at once. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive mb-1">Warning</p>
                <p className="text-sm text-muted-foreground">
                  Deleting institutions will also delete all associated programs. This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deleteIds">IDs to Delete (one per line or comma-separated)</Label>
            <Textarea
              id="deleteIds"
              value={idsInput}
              onChange={(e) => setIdsInput(e.target.value)}
              placeholder="Enter UUIDs, one per line or comma-separated"
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Maximum 100 items per operation. Each ID must be a valid UUID.
            </p>
          </div>
          <Button
            onClick={handleDeleteClick}
            disabled={deleteMutation.isPending || !idsInput.trim()}
            variant="destructive"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {entityType}s
              </>
            )}
          </Button>
          {deleteMutation.data?.data?.errors && deleteMutation.data.data.errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="font-semibold text-destructive mb-2">Errors:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {deleteMutation.data.data.errors.slice(0, 10).map((error: any, index: number) => (
                  <li key={index}>
                    {error.id}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {idsToDelete.length} {entityType}(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 max-h-60 overflow-y-auto">
            <p className="font-semibold text-sm mb-2">IDs to be deleted:</p>
            <ul className="list-disc list-inside space-y-1 text-xs font-mono">
              {idsToDelete.slice(0, 20).map((id, index) => (
                <li key={index}>{id}</li>
              ))}
              {idsToDelete.length > 20 && (
                <li className="text-muted-foreground">... and {idsToDelete.length - 20} more</li>
              )}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirm Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

