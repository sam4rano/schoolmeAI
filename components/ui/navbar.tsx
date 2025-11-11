"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { Menu, X, User, LogOut, Shield, LayoutDashboard, ChevronDown, Building2, GraduationCap, Calculator, Sparkles, MessageSquare, BarChart3, DollarSign, TrendingUp, Bell, Newspaper } from "lucide-react"
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
      { href: "/recommendations", label: "AI Recommendations", icon: Sparkles },
      { href: "/ai", label: "AI Assistant", icon: MessageSquare },
    ],
  },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  {
    label: "More",
    items: [
      { href: "/community", label: "Community", icon: MessageSquare },
      { href: "/news", label: "News", icon: Newspaper },
    ],
  },
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
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="edurepoAI.xyz Home"
            >
              <span className="text-2xl" aria-hidden="true">🇳🇬</span>
              <span className="text-lg sm:text-xl font-bold whitespace-nowrap">edurepoAI.xyz</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl">
            {navItems.map((item) => {
              if ("href" in item && item.href) {
                // Direct link
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative rounded-md",
                      active
                        ? "text-black"
                        : "text-muted-foreground hover:text-white hover:bg-accent"
                    )}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.icon && <item.icon className="h-4 w-4" aria-hidden="true" />}
                    {item.label}
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
                          "flex items-center gap-1.5 px-3 py-2 text-sm font-medium h-auto rounded-md",
                          hasActiveItem
                            ? "text-black hover:text-white"
                            : "text-muted-foreground hover:text-white hover:bg-accent"
                        )}
                        aria-label={`${item.label} menu`}
                      >
                        {item.label}
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon
                        return (
                          <DropdownMenuItem key={subItem.href} asChild>
                            <Link
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                isActive(subItem.href) && "bg-accent font-medium"
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Search - Medium screens and up */}
            <div className="hidden md:block lg:hidden w-48">
              <SearchAutocomplete
                placeholder="Search..."
                showResults={true}
                className="w-full"
              />
            </div>
            {/* Search - Large screens */}
            <div className="hidden lg:block w-56">
              <SearchAutocomplete
                placeholder="Search institutions, programs..."
                showResults={true}
                className="w-full"
              />
            </div>
            
            {status === "authenticated" && session?.user ? (
              <>
                <NotificationBell />
                <Link href={isAdmin ? "/admin" : "/dashboard"} className="hidden xl:block">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden 2xl:inline">{isAdmin ? "Admin" : "Dashboard"}</span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 h-9 px-2 sm:px-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {session.user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden xl:inline-block text-sm font-medium max-w-[100px] truncate">
                        {session.user.email?.split("@")[0] || "User"}
                      </span>
                      {isAdmin && (
                        <Badge variant="default" className="hidden xl:inline-flex text-xs px-1.5 py-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{session.user.email}</p>
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
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="cursor-pointer">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
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
                  <Button 
                    size="sm" 
                    className="gap-1.5"
                    aria-label="Get Started"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1.5"
                    aria-label="Sign In"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 bg-background border-b lg:hidden z-50 shadow-lg">
              <div className="container mx-auto px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Mobile Search */}
                <div className="mb-4 pb-4 border-b">
                  <SearchAutocomplete
                    placeholder="Search..."
                    showResults={true}
                    className="w-full"
                  />
                </div>

                {/* Navigation Items */}
                {navItems.map((item) => {
                  if ("href" in item) {
                    const active = isActive(item.href || "")
                    return (
                      <Link
                        key={item.href}
                        href={item.href || "#"}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        {item.label}
                      </Link>
                    )
                  } else {
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {item.label}
                        </div>
                        {item.items.map((subItem) => {
                          const active = isActive(subItem.href)
                          const SubIcon = subItem.icon
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-colors",
                                active
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              {SubIcon && <SubIcon className="h-4 w-4" />}
                              {subItem.label}
                            </Link>
                          )
                        })}
                      </div>
                    )
                  }
                })}

                {/* User Actions */}
                {status === "authenticated" && session?.user && (
                  <>
                    <div className="border-t my-3 pt-3">
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Account
                      </div>
                      <Link
                        href={isAdmin ? "/admin" : "/dashboard"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {isAdmin ? "Admin Dashboard" : "Student Dashboard"}
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Bell className="h-4 w-4" />
                        Notifications
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false)
                          signOut({ callbackUrl: "/" })
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
                {status !== "authenticated" && (
                  <>
                    <div className="border-t my-3 pt-3 space-y-2">
                      <Link
                        href="/calculator"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-center px-4 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Get Started
                      </Link>
                      <Link
                        href="/auth/signin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-center px-4 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-accent"
                      >
                        Sign In
                      </Link>
                    </div>
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
