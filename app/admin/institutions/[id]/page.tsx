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
import { ArrowLeft, Save, Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EditInstitutionPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [institutionId, setInstitutionId] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    type: "university" as const,
    ownership: "federal" as const,
    state: "",
    city: "",
    website: "",
    accreditationStatus: "",
    contact: {
      email: "",
      phone: "",
      address: "",
    },
  })

  // Handle both Promise and direct params
  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setInstitutionId(p.id))
    } else {
      setInstitutionId(params.id)
    }
  }, [params])

  const { data, isLoading } = useQuery({
    queryKey: ["admin-institution", institutionId],
    queryFn: async () => {
      if (!institutionId) return null
      const response = await fetch(`/api/admin/institutions/${institutionId}`)
      if (!response.ok) throw new Error("Failed to fetch institution")
      const data = await response.json()
      return data.data
    },
    enabled: !!institutionId,
  })

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        type: data.type || "university",
        ownership: data.ownership || "federal",
        state: data.state || "",
        city: data.city || "",
        website: data.website || "",
        accreditationStatus: data.accreditationStatus || "",
        contact: data.contact
          ? {
              email: data.contact.email || "",
              phone: data.contact.phone || "",
              address: data.contact.address || "",
            }
          : {
              email: "",
              phone: "",
              address: "",
            },
      })
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/admin/institutions/${institutionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update institution")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-institution", institutionId] })
      queryClient.invalidateQueries({ queryKey: ["admin-institutions"] })
      toast({
        title: "Success",
        description: "Institution updated successfully",
      })
      router.push("/admin/institutions")
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
        <p className="text-muted-foreground">Institution not found</p>
        <Link href="/admin/institutions">
          <Button variant="outline" className="mt-4">
            Back to Institutions
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/institutions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold">Edit Institution</h1>
          <p className="text-muted-foreground mt-2">
            Update institution information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Institution name and type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="polytechnic">Polytechnic</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="nursing">Nursing</SelectItem>
                    <SelectItem value="military">Military</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership *</Label>
                <Select
                  value={formData.ownership}
                  onValueChange={(value: any) => setFormData({ ...formData, ownership: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Website and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
                {formData.website && (
                  <a
                    href={formData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {!formData.website && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Website URL is missing</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@institution.edu.ng"
                value={formData.contact.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, email: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 XXX XXX XXXX"
                value={formData.contact.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, phone: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Full address"
                value={formData.contact.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, address: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accreditationStatus">Accreditation Status</Label>
              <Input
                id="accreditationStatus"
                value={formData.accreditationStatus}
                onChange={(e) => setFormData({ ...formData, accreditationStatus: e.target.value })}
                placeholder="e.g., Fully Accredited"
              />
            </div>
          </CardContent>
        </Card>

        {/* Programs */}
        {data.programs && data.programs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Programs ({data.programs.length})</CardTitle>
              <CardDescription>Programs offered by this institution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.programs.map((program: any) => (
                  <Link
                    key={program.id}
                    href={`/admin/programs/${program.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{program.name}</p>
                      {program.degreeType && (
                        <Badge variant="outline" className="mt-1">
                          {program.degreeType}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/institutions">
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

