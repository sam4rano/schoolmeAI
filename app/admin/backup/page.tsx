"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Database, Download, Upload, Trash2, Loader2, HardDrive } from "lucide-react"

interface Backup {
  filePath: string
  size: number
  timestamp: Date
}

export default function BackupPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: backups, isLoading, refetch } = useQuery<Backup[]>({
    queryKey: ["backups"],
    queryFn: async () => {
      const response = await fetch("/api/admin/backup?action=list")
      if (!response.ok) throw new Error("Failed to fetch backups")
      const data = await response.json()
      return data.data || []
    },
  })

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", format: "sql", compress: true }),
      })
      if (!response.ok) throw new Error("Failed to create backup")
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["backups"] })
      toast({
        title: "Backup created",
        description: data.data?.filePath ? `Backup saved to ${data.data.filePath}` : "Backup created successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Backup failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const restoreBackupMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", filePath }),
      })
      if (!response.ok) throw new Error("Failed to restore backup")
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Backup restored",
        description: "Database has been restored from backup",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Restore failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Backups</h1>
          <p className="text-muted-foreground">Create, restore, and manage database backups</p>
        </div>
        <Button
          onClick={() => createBackupMutation.mutate()}
          disabled={createBackupMutation.isPending}
        >
          {createBackupMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Create Backup
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
          <CardDescription>List of all database backups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups && backups.length > 0 ? (
              backups.map((backup, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{backup.filePath.split("/").pop()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(backup.timestamp).toLocaleString()} • {formatFileSize(backup.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreBackupMutation.mutate(backup.filePath)}
                      disabled={restoreBackupMutation.isPending}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No backups found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

