"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  GraduationCap,
  TrendingUp,
  ExternalLink,
  Edit,
  FileText,
  Globe,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DataQualityMetrics {
  totalInstitutions: number
  totalPrograms: number
  institutionsWithoutWebsite: number
  programsWithoutCutoff: number
  programsWithoutDescription: number
  overallScore: number
  websiteScore: number
  cutoffScore: number
  descriptionScore: number
}

interface Issue {
  id: string
  name: string
  type: "institution" | "program"
  issue: "missingWebsite" | "missingCutoff" | "missingDescription"
  metadata: any
}

function useDataQuality(issueType?: string) {
  return useQuery<{
    metrics: DataQualityMetrics
    issues: Issue[]
  }>({
    queryKey: ["admin-data-quality", issueType],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (issueType) searchParams.set("issueType", issueType)
      searchParams.set("limit", "100")

      const response = await fetch(`/api/admin/data-quality?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch data quality")
      return response.json()
    },
  })
}

export default function DataQualityPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const { data: overviewData, isLoading: overviewLoading } = useDataQuality()
  const { data: websiteData, isLoading: websiteLoading } = useDataQuality("missingWebsite")
  const { data: cutoffData, isLoading: cutoffLoading } = useDataQuality("missingCutoff")
  const { data: descriptionData, isLoading: descriptionLoading } = useDataQuality("missingDescription")

  const metrics = overviewData?.metrics
  const websiteIssues = websiteData?.issues || []
  const cutoffIssues = cutoffData?.issues || []
  const descriptionIssues = descriptionData?.issues || []

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Data Quality Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and improve data completeness across the platform
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${getScoreColor(metrics?.overallScore || 0)}`}>
                  {metrics?.overallScore || 0}%
                </div>
                <Badge variant={getScoreBadge(metrics?.overallScore || 0)} className="mt-1">
                  {metrics && metrics.overallScore >= 80
                    ? "Excellent"
                    : metrics && metrics.overallScore >= 60
                    ? "Good"
                    : "Needs Improvement"}
                </Badge>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Website Coverage</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${getScoreColor(metrics?.websiteScore || 0)}`}>
                  {metrics?.websiteScore || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.institutionsWithoutWebsite || 0} institutions missing websites
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cutoff Data</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${getScoreColor(metrics?.cutoffScore || 0)}`}>
                  {metrics?.cutoffScore || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.programsWithoutCutoff || 0} programs missing cutoff data
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${getScoreColor(metrics?.descriptionScore || 0)}`}>
                  {metrics?.descriptionScore || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.programsWithoutDescription || 0} programs missing descriptions
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Issues</CardTitle>
          <CardDescription>
            Click on any item to edit and fix the issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="websites">
                <Globe className="mr-2 h-4 w-4" />
                Missing Websites ({websiteIssues.length})
              </TabsTrigger>
              <TabsTrigger value="cutoffs">
                <FileText className="mr-2 h-4 w-4" />
                Missing Cutoffs ({cutoffIssues.length})
              </TabsTrigger>
              <TabsTrigger value="descriptions">
                <FileText className="mr-2 h-4 w-4" />
                Missing Descriptions ({descriptionIssues.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="websites" className="mt-6">
              {websiteLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : websiteIssues.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">All institutions have websites! 🎉</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Ownership</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Programs</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {websiteIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{issue.metadata.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{issue.metadata.ownership}</Badge>
                        </TableCell>
                        <TableCell>{issue.metadata.state}</TableCell>
                        <TableCell>{issue.metadata.programsCount}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/institutions/${issue.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Add Website
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="cutoffs" className="mt-6">
              {cutoffLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : cutoffIssues.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">All programs have cutoff data! 🎉</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Degree Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cutoffIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{issue.metadata.institution}</p>
                            <p className="text-xs text-muted-foreground">
                              {issue.metadata.institutionType} • {issue.metadata.state}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {issue.metadata.degreeType ? (
                            <Badge variant="outline">{issue.metadata.degreeType}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>{issue.metadata.state}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/programs/${issue.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Add Cutoff
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="descriptions" className="mt-6">
              {descriptionLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : descriptionIssues.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">All programs have descriptions! 🎉</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Degree Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {descriptionIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{issue.metadata.institution}</p>
                            <p className="text-xs text-muted-foreground">
                              {issue.metadata.institutionType} • {issue.metadata.state}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {issue.metadata.degreeType ? (
                            <Badge variant="outline">{issue.metadata.degreeType}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>{issue.metadata.state}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/programs/${issue.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Add Description
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common data quality tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/institutions?missingWebsite=true">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                View All Institutions Missing Websites
              </Button>
            </Link>
            <Link href="/admin/programs?missingCutoff=true">
              <Button variant="outline" className="w-full justify-start">
                <GraduationCap className="mr-2 h-4 w-4" />
                View All Programs Missing Cutoff Data
              </Button>
            </Link>
            <Link href="/admin/programs?missingDescription=true">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View All Programs Missing Descriptions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Quality Tips</CardTitle>
            <CardDescription>Best practices for maintaining data quality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Website URLs</p>
                <p className="text-muted-foreground">
                  Always include https:// prefix. Verify URLs are accessible.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Cutoff Data</p>
                <p className="text-muted-foreground">
                  Add at least 3-5 years of historical cutoff data for accurate calculations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Descriptions</p>
                <p className="text-muted-foreground">
                  Include comprehensive program descriptions to help students make informed decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

