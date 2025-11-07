"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Loader2, Check, X, Calendar, Bookmark, Sparkles, TrendingUp, DollarSign, Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: string
  link?: string
  metadata?: any
  createdAt: string
  readAt?: string
}

interface NotificationListProps {
  onRead?: () => void
  limit?: number
}

const typeIcons = {
  deadline_reminder: Calendar,
  watchlist_update: Bookmark,
  new_program: Sparkles,
  cutoff_update: TrendingUp,
  fee_update: DollarSign,
  general: Bell,
}

const typeColors = {
  deadline_reminder: "text-orange-500",
  watchlist_update: "text-blue-500",
  new_program: "text-green-500",
  cutoff_update: "text-purple-500",
  fee_update: "text-yellow-500",
  general: "text-gray-500",
}

export function NotificationList({ onRead, limit = 10 }: NotificationListProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("unread")

  const fetchNotifications = useCallback(async () => {
    if (!session) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/notifications?status=${statusFilter}&limit=${limit}`
      )
      if (!response.ok) throw new Error("Failed to fetch notifications")
      const data = await response.json()
      setNotifications(data.data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [session, statusFilter, limit, toast])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "read" }),
      })
      if (!response.ok) throw new Error("Failed to mark as read")
      fetchNotifications()
      onRead?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as read",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to mark all as read")
      fetchNotifications()
      onRead?.()
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete notification")
      fetchNotifications()
      onRead?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const Icon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons] || Bell
    const colorClass = typeColors[type as keyof typeof typeColors] || "text-gray-500"
    return <IconComponent className={`h-4 w-4 ${colorClass}`} />
  }

  if (!session) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Please sign in to view notifications
      </div>
    )
  }

  return (
    <div className="max-h-[500px] overflow-y-auto">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <CardTitle className="text-base">Notifications</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {notifications.length > 0 && statusFilter === "unread" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No {statusFilter} notifications
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => {
            const handleClick = () => {
              if (notification.status === "unread") {
                handleMarkAsRead(notification.id)
              }
            }

            const content = (
              <div
                onClick={handleClick}
                className={`p-4 hover:bg-muted transition-colors ${
                  notification.status === "unread" ? "bg-muted/50" : ""
                } ${notification.link ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{Icon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      {notification.status === "unread" && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <div className="flex gap-1">
                        {notification.status === "unread" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )

            if (notification.link) {
              return (
                <Link key={notification.id} href={notification.link}>
                  {content}
                </Link>
              )
            }

            return (
              <div key={notification.id}>
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

