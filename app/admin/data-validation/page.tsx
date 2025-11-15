"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react"

export default function DataValidationPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("duplicates")

  const { data: duplicates, isLoading: duplicatesLoading, refetch: refetchDuplicates } = useQuery({
    queryKey: ["data-validation", "duplicates"],
    queryFn: async () => {
      const response = await fetch("/api/admin/data-validation?action=duplicates")
      if (!response.ok) throw new Error("Failed to fetch duplicates")
      return response.json()
    },
    enabled: activeTab === "duplicates",
  })

  const { data: consistency, isLoading: consistencyLoading, refetch: refetchConsistency } = useQuery({
    queryKey: ["data-validation", "consistency"],
    queryFn: async () => {
      const response = await fetch("/api/admin/data-validation?action=consistency")
      if (!response.ok) throw new Error("Failed to fetch consistency check")
      return response.json()
    },
    enabled: activeTab === "consistency",
  })

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/data-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup" }),
      })
      if (!response.ok) throw new Error("Failed to run cleanup")
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup completed",
        description: `Cleaned ${data.data?.cleaned || 0} items`,
      })
      refetchDuplicates()
      refetchConsistency()
    },
    onError: (error: Error) => {
      toast({
        title: "Cleanup failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Validation</h1>
        <p className="text-muted-foreground">Check data quality, detect duplicates, and validate consistency</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
          <TabsTrigger value="consistency">Consistency</TabsTrigger>
        </TabsList>

        <TabsContent value="duplicates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Duplicate Detection</CardTitle>
                  <CardDescription>Find duplicate institutions and programs</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => refetchDuplicates()}
                  disabled={duplicatesLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {duplicatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Duplicate Institutions</h3>
                    <p className="text-sm text-muted-foreground">
                      {duplicates?.data?.duplicateInstitutions?.length || 0} found
                    </p>
                    {duplicates?.data?.duplicateInstitutions?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {duplicates.data.duplicateInstitutions.slice(0, 10).map((dup: any, idx: number) => (
                          <div key={idx} className="p-2 border rounded text-sm">
                            {dup.name} (ID: {dup.id})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Duplicate Programs</h3>
                    <p className="text-sm text-muted-foreground">
                      {duplicates?.data?.duplicatePrograms?.length || 0} found
                    </p>
                    {duplicates?.data?.duplicatePrograms?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {duplicates.data.duplicatePrograms.slice(0, 10).map((dup: any, idx: number) => (
                          <div key={idx} className="p-2 border rounded text-sm">
                            {dup.name} at {dup.institution} (ID: {dup.id})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consistency">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Consistency</CardTitle>
                  <CardDescription>Validate data integrity and relationships</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => refetchConsistency()}
                    disabled={consistencyLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => cleanupMutation.mutate()}
                    disabled={cleanupMutation.isPending}
                  >
                    {cleanupMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Run Cleanup
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consistencyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {consistency?.data?.isValid ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Data is consistent</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Issues found: {consistency?.data?.issues?.length || 0}</span>
                      </div>
                      {consistency?.data?.issues?.map((issue: string, idx: number) => (
                        <div key={idx} className="p-2 border rounded text-sm text-muted-foreground">
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

