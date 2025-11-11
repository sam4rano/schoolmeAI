"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, Save, GraduationCap } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface OLevel {
  id: string
  examBody: string
  year: number
  grades: Record<string, string>
  computedPoints?: number | null
  computedSummary?: string | null
}

interface ScoresManagementProps {
  jambScore: number | null
  oLevels: OLevel[]
  onJambScoreUpdate: (score: number | null) => void
  onOLevelsUpdate: () => void
}

const COMMON_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Geography",
  "History",
  "Commerce",
  "Accounting",
  "Further Mathematics",
  "Agricultural Science",
  "Technical Drawing",
]

const GRADE_OPTIONS = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"]

export function ScoresManagement({ jambScore, oLevels, onJambScoreUpdate, onOLevelsUpdate }: ScoresManagementProps) {
  const { toast } = useToast()
  const [jamb, setJamb] = useState<string>(jambScore?.toString() || "")
  const [savingJamb, setSavingJamb] = useState(false)
  const [loadingOLevels, setLoadingOLevels] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOLevel, setEditingOLevel] = useState<OLevel | null>(null)
  const [formData, setFormData] = useState({
    examBody: "WAEC" as "WAEC" | "NECO" | "GCE" | "NABTEB",
    year: new Date().getFullYear(),
    grades: {} as Record<string, string>,
  })

  const handleSaveJamb = async () => {
    const score = jamb ? parseInt(jamb) : null
    if (score !== null && (score < 0 || score > 400)) {
      toast({
        title: "Invalid Score",
        description: "JAMB score must be between 0 and 400",
        variant: "destructive",
      })
      return
    }

    setSavingJamb(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jambScore: score }),
      })
      if (!response.ok) throw new Error("Failed to save JAMB score")
      onJambScoreUpdate(score)
      toast({
        title: "Success",
        description: "JAMB score updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save JAMB score",
        variant: "destructive",
      })
    } finally {
      setSavingJamb(false)
    }
  }

  const handleSaveOLevel = async () => {
    if (Object.keys(formData.grades).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one subject",
        variant: "destructive",
      })
      return
    }

    setLoadingOLevels(true)
    try {
      const url = editingOLevel
        ? `/api/profile/olevels?id=${editingOLevel.id}`
        : "/api/profile/olevels"
      const method = editingOLevel ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save O-level results")
      onOLevelsUpdate()
      setDialogOpen(false)
      setEditingOLevel(null)
      setFormData({
        examBody: "WAEC",
        year: new Date().getFullYear(),
        grades: {},
      })
      toast({
        title: "Success",
        description: editingOLevel ? "O-level results updated" : "O-level results added",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save O-level results",
        variant: "destructive",
      })
    } finally {
      setLoadingOLevels(false)
    }
  }

  const handleDeleteOLevel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this O-level result?")) return

    setLoadingOLevels(true)
    try {
      const response = await fetch(`/api/profile/olevels?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      onOLevelsUpdate()
      toast({
        title: "Success",
        description: "O-level result deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete O-level result",
        variant: "destructive",
      })
    } finally {
      setLoadingOLevels(false)
    }
  }

  const openEditDialog = (olevel: OLevel) => {
    setEditingOLevel(olevel)
    setFormData({
      examBody: olevel.examBody as "WAEC" | "NECO" | "GCE" | "NABTEB",
      year: olevel.year,
      grades: olevel.grades,
    })
    setDialogOpen(true)
  }

  const addSubject = () => {
    const subject = prompt("Enter subject name:")
    if (subject && !formData.grades[subject]) {
      setFormData({
        ...formData,
        grades: { ...formData.grades, [subject]: "C6" },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* JAMB Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            JAMB Score
          </CardTitle>
          <CardDescription>
            Enter your UTME/JAMB score (0-400)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              max="400"
              value={jamb}
              onChange={(e) => setJamb(e.target.value)}
              placeholder="Enter JAMB score"
              className="max-w-xs"
            />
            <Button onClick={handleSaveJamb} disabled={savingJamb}>
              {savingJamb ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
          {jambScore !== null && (
            <p className="text-sm text-muted-foreground">
              Current JAMB Score: <span className="font-semibold">{jambScore}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* O-Level Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>O-Level Results</CardTitle>
              <CardDescription>
                Manage your O-level examination results
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingOLevel(null)
                  setFormData({
                    examBody: "WAEC",
                    year: new Date().getFullYear(),
                    grades: {},
                  })
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add O-Level
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOLevel ? "Edit" : "Add"} O-Level Results
                  </DialogTitle>
                  <DialogDescription>
                    Enter your O-level examination details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Exam Body</Label>
                      <Select
                        value={formData.examBody}
                        onValueChange={(value: "WAEC" | "NECO" | "GCE" | "NABTEB") =>
                          setFormData({ ...formData, examBody: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WAEC">WAEC</SelectItem>
                          <SelectItem value="NECO">NECO</SelectItem>
                          <SelectItem value="GCE">GCE</SelectItem>
                          <SelectItem value="NABTEB">NABTEB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input
                        type="number"
                        min="2000"
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Subjects & Grades</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSubject}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Subject
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                      {Object.entries(formData.grades).map(([subject, grade]) => (
                        <div key={subject} className="flex items-center gap-2">
                          <Input
                            value={subject}
                            onChange={(e) => {
                              const newGrades = { ...formData.grades }
                              delete newGrades[subject]
                              newGrades[e.target.value] = grade
                              setFormData({ ...formData, grades: newGrades })
                            }}
                            className="flex-1"
                          />
                          <Select
                            value={grade}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                grades: { ...formData.grades, [subject]: value },
                              })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_OPTIONS.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {g}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newGrades = { ...formData.grades }
                              delete newGrades[subject]
                              setFormData({ ...formData, grades: newGrades })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {Object.keys(formData.grades).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No subjects added. Click "Add Subject" to get started.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveOLevel} disabled={loadingOLevels}>
                      {loadingOLevels ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOLevels && oLevels.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : oLevels.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No O-level results added yet. Click "Add O-Level" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {oLevels.map((olevel) => (
                <Card key={olevel.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{olevel.examBody} {olevel.year}</CardTitle>
                        {olevel.computedSummary && (
                          <CardDescription>{olevel.computedSummary}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(olevel)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOLevel(olevel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(olevel.grades).map(([subject, grade]) => (
                        <div key={subject} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{subject}</span>
                          <Badge variant="secondary">{grade}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

