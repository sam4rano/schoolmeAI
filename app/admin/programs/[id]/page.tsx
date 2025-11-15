"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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

export default function EditProgramPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [programId, setProgramId] = useState<string>("")
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
    accreditationStatus: "",
    accreditationMaturityDate: "",
    isActive: true,
  })
  const [newUtmeSubject, setNewUtmeSubject] = useState("")
  const [newOlevelSubject, setNewOlevelSubject] = useState("")
  const [newCareer, setNewCareer] = useState("")

  // Handle both Promise and direct params
  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setProgramId(p.id))
    } else {
      setProgramId(params.id)
    }
  }, [params])

  // Fetch institutions for dropdown
  const { data: institutionsData } = useInstitutions({ limit: 1000 })
  const institutions = institutionsData?.data || []

  const { data, isLoading } = useQuery({
    queryKey: ["admin-program", programId],
    queryFn: async () => {
      if (!programId) return null
      const response = await fetch(`/api/admin/programs/${programId}`)
      if (!response.ok) throw new Error("Failed to fetch program")
      const data = await response.json()
      return data.data
    },
    enabled: !!programId,
  })

  useEffect(() => {
    if (data) {
      // Parse cutoff history
      let cutoffHistory: CutoffEntry[] = []
      if (data.cutoffHistory) {
        if (Array.isArray(data.cutoffHistory)) {
          cutoffHistory = data.cutoffHistory.map((entry: any) => ({
            year: entry.year || new Date().getFullYear(),
            cutoff: entry.cutoff || 0,
            admissionMode: entry.admissionMode || "UTME",
            sourceUrl: entry.sourceUrl || "",
            confidence: entry.confidence || "unverified",
          }))
        }
      }

      setFormData({
        institutionId: data.institutionId || "",
        name: data.name || "",
        faculty: data.faculty || "",
        department: data.department || "",
        degreeType: data.degreeType || "",
        description: data.description || "",
        duration: data.duration || "",
        utmeSubjects: Array.isArray(data.utmeSubjects) ? data.utmeSubjects : [],
        olevelSubjects: Array.isArray(data.olevelSubjects) ? data.olevelSubjects : [],
        cutoffHistory,
        applicationDeadline: data.applicationDeadline
          ? new Date(data.applicationDeadline).toISOString().split("T")[0]
          : "",
        careerProspects: Array.isArray(data.careerProspects) ? data.careerProspects : [],
        accreditationStatus: data.accreditationStatus || "",
        accreditationMaturityDate: data.accreditationMaturityDate?.toString() || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
      })
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          applicationDeadline: data.applicationDeadline || undefined,
          accreditationMaturityDate: data.accreditationMaturityDate
            ? parseInt(data.accreditationMaturityDate)
            : undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update program")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-program", programId] })
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] })
      toast({
        title: "Success",
        description: "Program updated successfully",
      })
      router.push("/admin/programs")
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
    updateMutation.mutate(formData)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Program not found</p>
        <Link href="/admin/programs">
          <Button variant="outline" className="mt-4">
            Back to Programs
          </Button>
        </Link>
      </div>
    )
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
          <h1 className="text-4xl font-bold">Edit Program</h1>
          <p className="text-muted-foreground mt-2">
            Update program information and cutoff data
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                placeholder="Program description and overview"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accreditation Information */}
        <Card>
          <CardHeader>
            <CardTitle>Accreditation Information</CardTitle>
            <CardDescription>
              Program accreditation status and expiration. Critical for students to verify program validity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accreditationStatus">Accreditation Status *</Label>
                <Select
                  value={formData.accreditationStatus}
                  onValueChange={(value) => setFormData({ ...formData, accreditationStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full">Full Accreditation</SelectItem>
                    <SelectItem value="Interim">Interim Accreditation</SelectItem>
                    <SelectItem value="Denied">Denied</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accreditationMaturityDate">Accreditation Expiry Year</Label>
                <Input
                  id="accreditationMaturityDate"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.accreditationMaturityDate}
                  onChange={(e) => setFormData({ ...formData, accreditationMaturityDate: e.target.value })}
                  placeholder="e.g., 2026, 2028"
                />
                <p className="text-xs text-muted-foreground">
                  Year when accreditation expires (e.g., 2024, 2026, 2028)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Program is currently active and being offered
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Uncheck if the program is no longer offered or has been discontinued
              </p>
            </div>
            {formData.accreditationMaturityDate && (
              <div className="p-3 rounded-md bg-muted">
                <p className="text-sm font-medium">Accreditation Status:</p>
                {parseInt(formData.accreditationMaturityDate) < new Date().getFullYear() ? (
                  <p className="text-sm text-destructive font-medium mt-1">
                    ⚠️ Accreditation expired in {formData.accreditationMaturityDate}
                  </p>
                ) : parseInt(formData.accreditationMaturityDate) <= new Date().getFullYear() + 1 ? (
                  <p className="text-sm text-yellow-600 font-medium mt-1">
                    ⚠️ Accreditation expires soon ({formData.accreditationMaturityDate})
                  </p>
                ) : (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    ✓ Accreditation valid until {formData.accreditationMaturityDate}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cutoff History */}
        <Card>
          <CardHeader>
            <CardTitle>Cutoff History</CardTitle>
            <CardDescription>
              Historical admission cutoff scores. This data is critical for eligibility calculations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CutoffHistoryEditor
              value={formData.cutoffHistory}
              onChange={(value) => setFormData({ ...formData, cutoffHistory: value })}
            />
          </CardContent>
        </Card>

        {/* Subjects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>UTME Subjects</CardTitle>
              <CardDescription>Required UTME subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newUtmeSubject}
                  onChange={(e) => setNewUtmeSubject(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addUtmeSubject())}
                  placeholder="e.g., Mathematics"
                />
                <Button type="button" onClick={addUtmeSubject}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.utmeSubjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="gap-1">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O-level Subjects</CardTitle>
              <CardDescription>Required O-level subjects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newOlevelSubject}
                  onChange={(e) => setNewOlevelSubject(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addOlevelSubject())}
                  placeholder="e.g., Mathematics"
                />
                <Button type="button" onClick={addOlevelSubject}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.olevelSubjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="gap-1">
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
            </CardContent>
          </Card>
        </div>

        {/* Career Prospects */}
        <Card>
          <CardHeader>
            <CardTitle>Career Prospects</CardTitle>
            <CardDescription>Career opportunities after graduation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCareer}
                onChange={(e) => setNewCareer(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCareer())}
                placeholder="e.g., Software Engineer"
              />
              <Button type="button" onClick={addCareer}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.careerProspects.map((career) => (
                <Badge key={career} variant="outline" className="gap-1">
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
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/programs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

