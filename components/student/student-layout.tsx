"use client"

import { StudentSidebar } from "./student-sidebar"
import { Loader2 } from "lucide-react"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"

interface StudentLayoutProps {
  children: React.ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const { isLoading, isAuthenticated } = useAuthGuard({
    requireAuth: true,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <StudentSidebar />
      <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  )
}

