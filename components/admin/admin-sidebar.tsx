"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BarChart3,
  FileText,
  Settings,
  Home,
  Menu,
  X,
  Upload,
  MessageSquare,
  Sparkles,
  Globe,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Institutions",
    href: "/admin/institutions",
    icon: Building2,
  },
  {
    title: "Programs",
    href: "/admin/programs",
    icon: GraduationCap,
  },
  {
    title: "Bulk Cutoff Entry",
    href: "/admin/programs/bulk-cutoff",
    icon: FileText,
  },
  {
    title: "Bulk Fee Entry",
    href: "/admin/programs/bulk-fees",
    icon: FileText,
  },
  {
    title: "Bulk Descriptions",
    href: "/admin/programs/bulk-descriptions",
    icon: FileText,
  },
  {
    title: "Data Quality",
    href: "/admin/data-quality",
    icon: BarChart3,
  },
  {
    title: "Audit Log",
    href: "/admin/audit",
    icon: FileText,
  },
  {
    title: "Bulk Operations",
    href: "/admin/bulk-operations",
    icon: Upload,
  },
  {
    title: "Review Moderation",
    href: "/admin/reviews",
    icon: MessageSquare,
  },
  {
    title: "AI Embeddings",
    href: "/admin/embeddings",
    icon: Sparkles,
  },
  {
    title: "Website Review",
    href: "/admin/websites/review",
    icon: Globe,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button - positioned below navbar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-background border-b p-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-bold text-base">Admin Panel</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 lg:top-0 h-[calc(100vh-4rem)] lg:h-screen left-0 z-30 w-64 flex-col border-r bg-background",
          "lg:flex lg:translate-x-0", // Always visible on desktop
          isMobileOpen ? "flex translate-x-0" : "-translate-x-full", // Mobile only transition
          "transition-transform duration-300 ease-in-out" // Smooth transition for mobile
        )}
        style={{ 
          willChange: "transform",
          isolation: "isolate",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      >
        <div className="flex h-16 items-center border-b px-6 pt-0">
          <Link href="/admin" className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
        
        <div className="border-t p-4">
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Home className="h-4 w-4" />
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  )
}

