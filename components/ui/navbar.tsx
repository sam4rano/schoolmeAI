"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { Menu, X, User, LogOut, Shield, LayoutDashboard, ChevronDown, Building2, GraduationCap, Calculator, Sparkles, MessageSquare, BarChart3, DollarSign, TrendingUp } from "lucide-react"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import { NotificationBell } from "@/components/notifications/notification-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home" },
  {
    label: "Browse",
    items: [
      { href: "/institutions", label: "Institutions", icon: Building2 },
      { href: "/programs", label: "Programs", icon: GraduationCap },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/calculator", label: "Eligibility Calculator", icon: Calculator },
      { href: "/calculator/fees", label: "Fee Calculator", icon: DollarSign },
      { href: "/calculator/post-utme", label: "Post-UTME Calculator", icon: TrendingUp },
      { href: "/recommendations", label: "Recommendations", icon: Sparkles },
      { href: "/ai", label: "AI Assistant", icon: MessageSquare },
    ],
  },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.roles?.includes("admin")

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/")

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🇳🇬</span>
              <span className="text-xl font-bold">EduRepo-NG-AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if ("href" in item && item.href) {
                // Direct link
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors relative",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </Link>
                )
              } else if ("items" in item && item.items) {
                // Dropdown menu
                const hasActiveItem = item.items.some((subItem) => subItem.href && isActive(subItem.href))
                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 text-sm font-medium h-auto",
                          hasActiveItem
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        {item.label}
                        <ChevronDown className="h-4 w-4" />
                        {hasActiveItem && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon
                        return (
                          <DropdownMenuItem key={subItem.href} asChild>
                            <Link
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                isActive(subItem.href) && "bg-accent"
                              )}
                            >
                              {SubIcon && <SubIcon className="h-4 w-4" />}
                              {subItem.label}
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:block w-64">
              <SearchAutocomplete
                placeholder="Search..."
                showResults={true}
                className="w-full"
              />
            </div>
            
            {status === "authenticated" && session?.user ? (
              <>
                <NotificationBell />
                <Link href={isAdmin ? "/admin" : "/dashboard"} className="hidden sm:block">
                  <Button size="sm" variant="outline" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {isAdmin ? "Admin" : "Dashboard"}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {session.user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline-block text-sm font-medium max-w-[120px] truncate">
                        {session.user.email}
                      </span>
                      {isAdmin && (
                        <Badge variant="default" className="hidden sm:inline-flex text-xs px-1.5 py-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.email}</p>
                        {isAdmin && (
                          <p className="text-xs text-muted-foreground">Administrator</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={isAdmin ? "/admin" : "/dashboard"} className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {isAdmin ? "Admin Dashboard" : "Student Dashboard"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/calculator" className="hidden sm:block">
                  <Button size="sm" className="hidden sm:inline-flex">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="sm" variant="outline" className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden z-50">
              <div className="container mx-auto px-4 py-4 space-y-2">
                {navItems.map((item) => {
                  if ("href" in item) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href || "#"}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          item.href && isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  } else {
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                          {item.label}
                        </div>
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive(subItem.href)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )
                  }
                })}
                {status === "authenticated" && session?.user && (
                  <>
                    <div className="border-t my-2"></div>
                    <Link
                      href={isAdmin ? "/admin" : "/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {isAdmin ? "Admin Dashboard" : "Student Dashboard"}
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: "/" })
                      }}
                      className="block w-full text-left px-4 py-2 rounded-md text-sm font-medium text-destructive hover:bg-accent"
                    >
                      Sign Out
                    </button>
                  </>
                )}
                {status !== "authenticated" && (
                  <>
                    <div className="border-t my-2"></div>
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 rounded-md text-sm font-medium text-primary hover:bg-accent"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
