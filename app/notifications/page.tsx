"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { Loader2, Bell, CheckCheck } from "lucide-react"
import { NotificationList } from "@/components/notifications/notification-list"

export default function NotificationsPage() {
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const limit = 20

  const fetchUnreadCount = useCallback(async () => {
    if (!session) return

    try {
      const response = await fetch("/api/notifications?status=unread&limit=1")
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.meta?.unreadCount || 0)
        setTotal(data.meta?.total || 0)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }, [session])

  useEffect(() => {
    if (status === "authenticated") {
      fetchUnreadCount()
    }
  }, [status, fetchUnreadCount])

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to mark all as read")
      fetchUnreadCount()
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

  const handleRead = () => {
    fetchUnreadCount()
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                  <Bell className="h-8 w-8 text-primary" />
                  Notifications
                </h1>
                <p className="text-muted-foreground">
                  Manage your notifications and stay updated
                </p>
              </div>
              {unreadCount > 0 && (
                <Button onClick={handleMarkAllRead} variant="outline" className="gap-2">
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-sm px-3 py-1">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>
                    View and manage all your notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <NotificationList
                onRead={handleRead}
                limit={limit}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                onStatusFilterChange={setStatusFilter}
                onTypeFilterChange={setTypeFilter}
                showFilters={true}
                showPagination={true}
                page={page}
                total={total}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
