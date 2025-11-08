"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, X, ExternalLink, AlertCircle, Globe, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InstitutionMatch {
  id: string
  name: string
  type: string
  ownership: string
  state: string
  city: string
  website: string | null
  suggestedWebsite?: string
  confidence?: number
  matchedName?: string
}

export default function WebsiteReviewPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [missingOnly, setMissingOnly] = useState(true)
  const [minConfidence, setMinConfidence] = useState<number | undefined>(70)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["website-review", page, missingOnly, minConfidence],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        missingOnly: missingOnly.toString(),
      })
      if (minConfidence !== undefined) {
        params.append("minConfidence", minConfidence.toString())
      }

      const response = await fetch(`/api/admin/websites/review?${params}`)
      if (!response.ok) throw new Error("Failed to fetch website matches")
      return response.json()
    },
  })

  const approveMutation = useMutation({
    mutationFn: async ({ institutionId, website, confidence }: { institutionId: string; website: string; confidence?: number }) => {
      const response = await fetch("/api/admin/websites/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId, website, confidence }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to approve website")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["website-review"] })
      toast({
        title: "Success",
        description: "Website approved and updated successfully",
      })
    },
  })

  const bulkApproveMutation = useMutation({
    mutationFn: async ({ institutionIds, minConfidence }: { institutionIds: string[]; minConfidence?: number }) => {
      const response = await fetch("/api/admin/websites/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionIds, minConfidence }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to bulk approve websites")
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["website-review"] })
      setSelectedIds(new Set())
      toast({
        title: "Success",
        description: data.message || `Successfully updated ${data.updated} institutions`,
      })
    },
  })

  const handleApprove = (institution: InstitutionMatch) => {
    if (!institution.suggestedWebsite) return
    approveMutation.mutate({
      institutionId: institution.id,
      website: institution.suggestedWebsite,
      confidence: institution.confidence,
    })
  }

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) {
      toast({
        title: "No selection",
        description: "Please select at least one institution",
        variant: "destructive",
      })
      return
    }

    bulkApproveMutation.mutate({
      institutionIds: Array.from(selectedIds),
      minConfidence,
    })
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === (data?.data?.length || 0)) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data?.data?.map((inst: InstitutionMatch) => inst.id) || []))
    }
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-500"
    if (confidence >= 90) return "bg-green-500"
    if (confidence >= 70) return "bg-yellow-500"
    return "bg-orange-500"
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Review</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve scraped website matches for institutions
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="missingOnly"
              checked={missingOnly}
              onCheckedChange={(checked) => setMissingOnly(checked === true)}
            />
            <Label htmlFor="missingOnly">Show only institutions without websites</Label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="minConfidence">Min Confidence:</Label>
              <Input
                id="minConfidence"
                type="number"
                min="0"
                max="100"
                value={minConfidence || ""}
                onChange={(e) => setMinConfidence(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending}
                className="ml-auto"
              >
                {bulkApproveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {data?.matchesCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No website matches found. Please run the website scraper first using{" "}
            <code className="bg-muted px-1 py-0.5 rounded">npm run enhance:websites</code>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Institutions ({data?.pagination?.total || 0})</CardTitle>
              <CardDescription>
                {data?.matchesCount || 0} website matches found
              </CardDescription>
            </div>
            {data?.data && data.data.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedIds.size === data.data.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No institutions found
            </div>
          ) : (
            <div className="space-y-4">
              {data?.data?.map((institution: InstitutionMatch) => (
                <div
                  key={institution.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedIds.has(institution.id)}
                        onCheckedChange={() => toggleSelect(institution.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{institution.name}</h3>
                          <Badge variant="outline">{institution.type}</Badge>
                          <Badge variant="outline">{institution.ownership}</Badge>
                          <Badge variant="outline">{institution.state}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {institution.city}
                        </p>
                        {institution.website && (
                          <div className="flex items-center gap-2 mt-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={institution.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {institution.website}
                            </a>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        {institution.suggestedWebsite && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getConfidenceColor(institution.confidence)}>
                                {institution.confidence?.toFixed(0) || 0}% confidence
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Matched with: {institution.matchedName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-green-600" />
                              <a
                                href={institution.suggestedWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:underline"
                              >
                                {institution.suggestedWebsite}
                              </a>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        {!institution.website && !institution.suggestedWebsite && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>No website found. Please add manually.</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {institution.suggestedWebsite && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(institution)}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.open(`/admin/institutions/${institution.id}`, "_blank")
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

