"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, Smartphone, Calendar, Bookmark, Sparkles, TrendingUp, DollarSign, Info } from "lucide-react"
import { Loader2, Save } from "lucide-react"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/constants/notifications"

interface NotificationPreferences {
  email: boolean
  push: boolean
  deadlineReminders: boolean
  watchlistUpdates: boolean
  newPrograms: boolean
  cutoffUpdates: boolean
  feeUpdates: boolean
  general: boolean
}

export function NotificationPreferences() {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchPreferences = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notifications/preferences")
      if (!response.ok) throw new Error("Failed to fetch preferences")
      const data = await response.json()
      setPreferences(data.data)
    } catch (error) {
      console.error("Error fetching preferences:", error)
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      })
      if (!response.ok) throw new Error("Failed to save preferences")
      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && "Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setPreferences({ ...preferences, push: true })
        toast({
          title: "Push notifications enabled",
          description: "You'll receive push notifications for important updates",
        })
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        })
      }
    } else {
      setPreferences({ ...preferences, push: false })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Configure how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-4 block">Delivery Methods</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.push}
                  onCheckedChange={handlePushToggle}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-4 block">Notification Types</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <Label className="text-sm font-medium">Deadline Reminders</Label>
                    <p className="text-xs text-muted-foreground">
                      Get reminded about application deadlines
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.deadlineReminders}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, deadlineReminders: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Bookmark className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label className="text-sm font-medium">Watchlist Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Updates about programs in your watchlist
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.watchlistUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, watchlistUpdates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-green-500" />
                  <div>
                    <Label className="text-sm font-medium">New Programs</Label>
                    <p className="text-xs text-muted-foreground">
                      Notifications about newly added programs
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.newPrograms}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, newPrograms: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <Label className="text-sm font-medium">Cutoff Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Updates about cutoff score changes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.cutoffUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, cutoffUpdates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  <div>
                    <Label className="text-sm font-medium">Fee Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Updates about tuition fee changes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.feeUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, feeUpdates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium">General Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      General updates and announcements
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.general}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, general: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

