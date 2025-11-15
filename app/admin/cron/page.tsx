"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Clock, Play, Pause, RefreshCw, Loader2 } from "lucide-react"
import { requireAdmin } from "@/lib/middleware/admin"

interface ScheduledTask {
  id: string
  name: string
  schedule: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

export default function CronJobsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tasks, isLoading, refetch } = useQuery<ScheduledTask[]>({
    queryKey: ["cron-tasks"],
    queryFn: async () => {
      const response = await fetch("/api/admin/cron")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      return data.data || []
    },
  })

  const enableMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch("/api/admin/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", taskId }),
      })
      if (!response.ok) throw new Error("Failed to enable task")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron-tasks"] })
      toast({ title: "Task enabled", description: "Scheduled task has been enabled" })
    },
  })

  const disableMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch("/api/admin/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", taskId }),
      })
      if (!response.ok) throw new Error("Failed to disable task")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron-tasks"] })
      toast({ title: "Task disabled", description: "Scheduled task has been disabled" })
    },
  })

  const runMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch("/api/admin/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", taskId }),
      })
      if (!response.ok) throw new Error("Failed to run task")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron-tasks"] })
      toast({ title: "Task executed", description: "Task has been executed successfully" })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheduled Tasks</h1>
        <p className="text-muted-foreground">Manage automated data updates and maintenance tasks</p>
      </div>

      <div className="grid gap-4">
        {tasks?.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {task.name}
                  </CardTitle>
                  <CardDescription>Schedule: {task.schedule}</CardDescription>
                </div>
                <Badge variant={task.enabled ? "default" : "secondary"}>
                  {task.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Last Run:</span>
                    <p className="font-medium">
                      {task.lastRun ? new Date(task.lastRun).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next Run:</span>
                    <p className="font-medium">
                      {task.nextRun ? new Date(task.nextRun).toLocaleString() : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.enabled ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disableMutation.mutate(task.id)}
                      disabled={disableMutation.isPending}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Disable
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => enableMutation.mutate(task.id)}
                      disabled={enableMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Enable
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runMutation.mutate(task.id)}
                    disabled={runMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks?.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No scheduled tasks found
          </CardContent>
        </Card>
      )}
    </div>
  )
}

