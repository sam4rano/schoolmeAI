"use client"

import { AdminSidebar } from "./admin-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, ShieldX, Home, LogOut } from "lucide-react"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isLoading, isAuthenticated, isAdmin, isAuthorized, status } = useAuthGuard({
    requireAuth: true,
    requireAdmin: true,
  })

  // Show loading only if no cached session exists and not in error state
  if (isLoading && status !== "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If session check failed (decryption error), show error and clear session
  if (status === "unauthenticated" && !isLoading) {
    // Try to clear corrupted session
    if (typeof window !== "undefined") {
      fetch("/api/auth/signout", { method: "POST" }).catch(() => {
        // Ignore errors
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <ShieldX className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-2xl font-bold">Authentication Required</h2>
                <p className="text-muted-foreground mt-2">
                  Please sign in to access the admin panel
                </p>
              </div>
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/admin")}`}>
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <ShieldX className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground mt-2">
                  You don&apos;t have permission to access the admin panel
                </p>
              </div>
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ isolation: "isolate" }}>
      {/* Minimal Admin Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background flex items-center justify-between px-4 lg:pl-72">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Admin Panel</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {session?.user?.email && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {session.user.email}
            </span>
          )}
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Site</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden pt-16">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto lg:ml-64" style={{ isolation: "isolate" }}>
          <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

