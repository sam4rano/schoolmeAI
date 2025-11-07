"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, X, Check } from "lucide-react"

interface CutoffEntry {
  year: number
  cutoff: number
  admissionMode: "UTME" | "POST_UTME" | "DIRECT_ENTRY"
  sourceUrl?: string
  confidence: "verified" | "estimated" | "unverified"
}

interface CutoffHistoryEditorProps {
  value: CutoffEntry[]
  onChange: (value: CutoffEntry[]) => void
}

export function CutoffHistoryEditor({ value, onChange }: CutoffHistoryEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<CutoffEntry>({
    year: new Date().getFullYear(),
    cutoff: 0,
    admissionMode: "UTME",
    confidence: "unverified",
  })

  const handleAdd = () => {
    if (formData.year && formData.cutoff > 0) {
      onChange([...value, formData])
      setFormData({
        year: new Date().getFullYear(),
        cutoff: 0,
        admissionMode: "UTME",
        confidence: "unverified",
      })
    }
  }

  const handleEdit = (index: number) => {
    setFormData(value[index])
    setEditingIndex(index)
  }

  const handleUpdate = () => {
    if (editingIndex !== null && formData.year && formData.cutoff > 0) {
      const updated = [...value]
      updated[editingIndex] = formData
      onChange(updated)
      setEditingIndex(null)
      setFormData({
        year: new Date().getFullYear(),
        cutoff: 0,
        admissionMode: "UTME",
        confidence: "unverified",
      })
    }
  }

  const handleDelete = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setFormData({
      year: new Date().getFullYear(),
      cutoff: 0,
      admissionMode: "UTME",
      confidence: "unverified",
    })
  }

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      verified: "default",
      estimated: "secondary",
      unverified: "outline",
    }
    return (
      <Badge variant={variants[confidence] || "outline"} className="text-xs">
        {confidence}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Cutoff History</Label>
        <span className="text-sm text-muted-foreground">
          {value.length} {value.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Add/Edit Form */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-4 border rounded-lg bg-muted/50">
        <div>
          <Label htmlFor="year" className="text-xs">Year</Label>
          <Input
            id="year"
            type="number"
            min="2000"
            max={new Date().getFullYear()}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
            placeholder="2024"
            className="h-9"
          />
        </div>
        <div>
          <Label htmlFor="cutoff" className="text-xs">Cutoff</Label>
          <Input
            id="cutoff"
            type="number"
            min="0"
            max="400"
            value={formData.cutoff}
            onChange={(e) => setFormData({ ...formData, cutoff: parseFloat(e.target.value) || 0 })}
            placeholder="200"
            className="h-9"
          />
        </div>
        <div>
          <Label htmlFor="admissionMode" className="text-xs">Mode</Label>
          <Select
            value={formData.admissionMode}
            onValueChange={(value: any) => setFormData({ ...formData, admissionMode: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTME">UTME</SelectItem>
              <SelectItem value="POST_UTME">POST_UTME</SelectItem>
              <SelectItem value="DIRECT_ENTRY">Direct Entry</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="confidence" className="text-xs">Confidence</Label>
          <Select
            value={formData.confidence}
            onValueChange={(value: any) => setFormData({ ...formData, confidence: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="estimated">Estimated</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          {editingIndex !== null ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleUpdate}
                className="flex-1"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              className="w-full"
              disabled={!formData.year || formData.cutoff <= 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Source URL (optional) */}
      <div>
        <Label htmlFor="sourceUrl" className="text-xs">Source URL (optional)</Label>
        <Input
          id="sourceUrl"
          type="url"
          value={formData.sourceUrl || ""}
          onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
          placeholder="https://example.com/source"
          className="h-9"
        />
      </div>

      {/* Entries Table */}
      {value.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value
                .sort((a, b) => b.year - a.year)
                .map((entry, index) => {
                  const originalIndex = value.indexOf(entry)
                  return (
                    <TableRow key={`${entry.year}-${originalIndex}`}>
                      <TableCell className="font-medium">{entry.year}</TableCell>
                      <TableCell>{entry.cutoff}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.admissionMode}</Badge>
                      </TableCell>
                      <TableCell>{getConfidenceBadge(entry.confidence)}</TableCell>
                      <TableCell>
                        {entry.sourceUrl ? (
                          <a
                            href={entry.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(originalIndex)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(originalIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {value.length === 0 && (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">
            No cutoff history entries. Add entries above.
          </p>
        </div>
      )}
    </div>
  )
}

