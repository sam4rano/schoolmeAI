"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WatchlistNotesProps {
  watchlistItemId: string
  currentNotes?: string | null
  onUpdate: () => void
  isInstitution?: boolean
}

export function WatchlistNotes({ watchlistItemId, currentNotes, onUpdate, isInstitution = false }: WatchlistNotesProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState(currentNotes || "")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const endpoint = isInstitution 
        ? `/api/watchlist/institutions/${watchlistItemId}`
        : `/api/watchlist/${watchlistItemId}`
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) throw new Error("Failed to save notes")

      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully",
      })
      setOpen(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          {currentNotes ? "Edit Notes" : "Add Notes"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Watchlist Notes</DialogTitle>
          <DialogDescription>
            Add personal notes or annotations for this {isInstitution ? "institution" : "program"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes here... (e.g., application requirements, personal thoughts, reminders)"
            rows={8}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

