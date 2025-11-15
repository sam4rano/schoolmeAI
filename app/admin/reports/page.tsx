"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { FileText, Loader2, Download } from "lucide-react"

export default function ReportsPage() {
  const { toast } = useToast()
  const [reportType, setReportType] = useState("overview")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ["report", reportType, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ type: reportType })
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const response = await fetch(`/api/admin/reports?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch report")
      return response.json()
    },
    enabled: false, // Only fetch when manually triggered
  })

  const handleGenerateReport = () => {
    refetch()
  }

  const handleExport = () => {
    if (!report) return
    const dataStr = JSON.stringify(report.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `report-${reportType}-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and view system reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="user-activity">User Activity</SelectItem>
                  <SelectItem value="data-usage">Data Usage</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="errors">Errors</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Report Results</CardTitle>
                <CardDescription>
                  {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(report.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

