"use client"

import { useSession } from "next-auth/react"
import { AdminSidebar } from "./admin-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, ShieldX } from "lucide-react"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
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
              <Link href="/auth/signin">
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAdmin = session?.user?.roles?.includes("admin")

  if (!isAdmin) {
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
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}

