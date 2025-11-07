"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CutoffHistoryEditor } from "@/components/admin/cutoff-history-editor"
import { useInstitutions } from "@/lib/hooks/use-institutions"

interface CutoffEntry {
  year: number
  cutoff: number
  admissionMode: "UTME" | "POST_UTME" | "DIRECT_ENTRY"
  sourceUrl?: string
  confidence: "verified" | "estimated" | "unverified"
}

export default function NewProgramPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    institutionId: "",
    name: "",
    faculty: "",
    department: "",
    degreeType: "",
    description: "",
    duration: "",
    utmeSubjects: [] as string[],
    olevelSubjects: [] as string[],
    cutoffHistory: [] as CutoffEntry[],
    applicationDeadline: "",
    careerProspects: [] as string[],
  })
  const [newUtmeSubject, setNewUtmeSubject] = useState("")
  const [newOlevelSubject, setNewOlevelSubject] = useState("")
  const [newCareer, setNewCareer] = useState("")

  // Fetch institutions for dropdown
  const { data: institutionsData } = useInstitutions({ limit: 1000 })
  const institutions = institutionsData?.data || []

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          applicationDeadline: data.applicationDeadline || undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create program")
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] })
      toast({
        title: "Success",
        description: "Program created successfully",
      })
      router.push(`/admin/programs/${data.data.id}`)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const addUtmeSubject = () => {
    if (newUtmeSubject.trim() && !formData.utmeSubjects.includes(newUtmeSubject.trim())) {
      setFormData({
        ...formData,
        utmeSubjects: [...formData.utmeSubjects, newUtmeSubject.trim()],
      })
      setNewUtmeSubject("")
    }
  }

  const removeUtmeSubject = (subject: string) => {
    setFormData({
      ...formData,
      utmeSubjects: formData.utmeSubjects.filter((s) => s !== subject),
    })
  }

  const addOlevelSubject = () => {
    if (newOlevelSubject.trim() && !formData.olevelSubjects.includes(newOlevelSubject.trim())) {
      setFormData({
        ...formData,
        olevelSubjects: [...formData.olevelSubjects, newOlevelSubject.trim()],
      })
      setNewOlevelSubject("")
    }
  }

  const removeOlevelSubject = (subject: string) => {
    setFormData({
      ...formData,
      olevelSubjects: formData.olevelSubjects.filter((s) => s !== subject),
    })
  }

  const addCareer = () => {
    if (newCareer.trim() && !formData.careerProspects.includes(newCareer.trim())) {
      setFormData({
        ...formData,
        careerProspects: [...formData.careerProspects, newCareer.trim()],
      })
      setNewCareer("")
    }
  }

  const removeCareer = (career: string) => {
    setFormData({
      ...formData,
      careerProspects: formData.careerProspects.filter((c) => c !== career),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/programs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold">New Program</h1>
          <p className="text-muted-foreground mt-2">
            Add a new program to the database
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Program name and institution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionId">Institution *</Label>
              <Select
                value={formData.institutionId}
                onValueChange={(value) => setFormData({ ...formData, institutionId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Input
                  id="faculty"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  placeholder="e.g., Faculty of Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Department of Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degreeType">Degree Type</Label>
                <Input
                  id="degreeType"
                  value={formData.degreeType}
                  onChange={(e) => setFormData({ ...formData, degreeType: e.target.value })}
                  placeholder="e.g., BSc, MBBS, LLB"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 4 years"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Program description..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Admission Requirements</CardTitle>
            <CardDescription>UTME and O-level subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>UTME Subjects</Label>
              <div className="flex gap-2">
                <Input
                  value={newUtmeSubject}
                  onChange={(e) => setNewUtmeSubject(e.target.value)}
                  placeholder="e.g., Mathematics"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addUtmeSubject()
                    }
                  }}
                />
                <Button type="button" onClick={addUtmeSubject} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.utmeSubjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.utmeSubjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="gap-2">
                      {subject}
                      <button
                        type="button"
                        onClick={() => removeUtmeSubject(subject)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>O-level Subjects</Label>
              <div className="flex gap-2">
                <Input
                  value={newOlevelSubject}
                  onChange={(e) => setNewOlevelSubject(e.target.value)}
                  placeholder="e.g., Mathematics"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addOlevelSubject()
                    }
                  }}
                />
                <Button type="button" onClick={addOlevelSubject} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.olevelSubjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.olevelSubjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="gap-2">
                      {subject}
                      <button
                        type="button"
                        onClick={() => removeOlevelSubject(subject)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cutoff History */}
        <Card>
          <CardHeader>
            <CardTitle>Cutoff History</CardTitle>
            <CardDescription>Historical admission cutoffs</CardDescription>
          </CardHeader>
          <CardContent>
            <CutoffHistoryEditor
              value={formData.cutoffHistory}
              onChange={(history) => setFormData({ ...formData, cutoffHistory: history })}
            />
          </CardContent>
        </Card>

        {/* Career Prospects */}
        <Card>
          <CardHeader>
            <CardTitle>Career Prospects</CardTitle>
            <CardDescription>Potential career paths</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCareer}
                onChange={(e) => setNewCareer(e.target.value)}
                placeholder="e.g., Software Engineer"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCareer()
                  }
                }}
              />
              <Button type="button" onClick={addCareer} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.careerProspects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.careerProspects.map((career) => (
                  <Badge key={career} variant="secondary" className="gap-2">
                    {career}
                    <button
                      type="button"
                      onClick={() => removeCareer(career)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/programs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Program
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

