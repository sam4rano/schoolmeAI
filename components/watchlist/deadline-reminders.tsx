"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Calendar, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface DeadlineRemindersProps {
  watchlistItems: any[]
}

export function DeadlineReminders({ watchlistItems }: DeadlineRemindersProps) {
  const { toast } = useToast()
  const [emailReminders, setEmailReminders] = useState(false)
  const [pushReminders, setPushReminders] = useState(false)

  // Get items with upcoming deadlines
  const itemsWithDeadlines = watchlistItems
    .filter((item) => {
      const deadline = item.program?.applicationDeadline
      if (!deadline) return false
      const daysRemaining = Math.ceil(
        (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysRemaining > 0 && daysRemaining <= 30 // Show items with deadlines in next 30 days
    })
    .sort((a, b) => {
      const deadlineA = new Date(a.program.applicationDeadline).getTime()
      const deadlineB = new Date(b.program.applicationDeadline).getTime()
      return deadlineA - deadlineB
    })

  const handleToggleEmailReminders = async (enabled: boolean) => {
    setEmailReminders(enabled)
    // TODO: Save preference to user settings
    toast({
      title: enabled ? "Email reminders enabled" : "Email reminders disabled",
      description: enabled
        ? "You'll receive email notifications for upcoming deadlines"
        : "Email reminders have been disabled",
    })
  }

  const handleTogglePushReminders = async (enabled: boolean) => {
    setPushReminders(enabled)
    // TODO: Save preference to user settings and request notification permission
    if (enabled && "Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        toast({
          title: "Push reminders enabled",
          description: "You'll receive push notifications for upcoming deadlines",
        })
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        })
        setPushReminders(false)
      }
    }
  }

  if (itemsWithDeadlines.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Deadline Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reminder Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for upcoming deadlines
              </p>
            </div>
            <Switch checked={emailReminders} onCheckedChange={handleToggleEmailReminders} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive browser push notifications for urgent deadlines
              </p>
            </div>
            <Switch checked={pushReminders} onCheckedChange={handleTogglePushReminders} />
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-semibold">Upcoming Deadlines</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {itemsWithDeadlines.slice(0, 5).map((item) => {
              const deadline = item.program.applicationDeadline
              const daysRemaining = Math.ceil(
                (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
              const isUrgent = daysRemaining <= 7

              return (
                <Link
                  key={item.id}
                  href={`/programs/${item.program.id}`}
                  className="block p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.program.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.program.institution.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Calendar
                        className={`h-4 w-4 ${isUrgent ? "text-red-600" : "text-muted-foreground"}`}
                      />
                      <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs">
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          {itemsWithDeadlines.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{itemsWithDeadlines.length - 5} more deadline(s)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

