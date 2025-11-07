"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { NotificationList } from "./notification-list"
import { useSession } from "next-auth/react"

export function NotificationBell() {
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchUnreadCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session, status])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?status=unread&limit=1")
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.meta?.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  if (status !== "authenticated" || !session) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <NotificationList onRead={() => fetchUnreadCount()} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

