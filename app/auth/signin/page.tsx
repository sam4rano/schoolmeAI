"use client"

import { useState, useEffect, useRef } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Eye, EyeOff } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailWarning, setShowEmailWarning] = useState(false)
  const hasRedirected = useRef(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Redirect if already logged in (only once)
  useEffect(() => {
    // Only redirect if authenticated and not already redirected
    if (status === "authenticated" && session?.user && !hasRedirected.current) {
      hasRedirected.current = true
      const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl")
      const targetUrl = callbackUrl || (session.user.roles?.includes("admin") ? "/admin" : "/dashboard")
      
      // Only redirect if we're not already on the target page
      if (pathname !== targetUrl && !pathname?.startsWith(targetUrl)) {
        // Redirect immediately without delay
        router.replace(targetUrl)
      }
    }

    // Reset redirect flag if status changes back to unauthenticated
    if (status === "unauthenticated") {
      hasRedirected.current = false
    }
  }, [status, session, router, pathname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("verify your email")) {
          setShowEmailWarning(true)
          setError(result.error)
        } else if (result.error.includes("suspended") || result.error.includes("banned")) {
          setError(result.error)
        } else {
          setError("Invalid email or password")
        }
        setLoading(false)
      } else {
        // Success - the useEffect will handle redirect when status becomes "authenticated"
        // Don't set loading to false here - let the redirect happen
        // The useEffect will redirect immediately when status changes
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  // Show loading only briefly while checking session (if no cached session)
  const hasSession = session && session.user
  if (status === "loading" && !hasSession) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  // If authenticated, show minimal loading while redirect happens
  // The useEffect will redirect immediately
  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {searchParams.get("registered") === "true" && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Account created! Please check your email to verify your account before signing in.
                  </AlertDescription>
                </Alert>
              )}

              {searchParams.get("verified") === "true" && (
                <Alert>
                  <AlertDescription>
                    Email verified successfully! You can now sign in.
                  </AlertDescription>
                </Alert>
              )}

              {searchParams.get("reset") === "true" && (
                <Alert>
                  <AlertDescription>
                    Password reset successfully! Please sign in with your new password.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showEmailWarning && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Your email is not verified.{" "}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/auth/resend-verification", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email }),
                          })
                          if (response.ok) {
                            setError(null)
                            setShowEmailWarning(false)
                            alert("Verification email sent! Please check your inbox.")
                          }
                        } catch (err) {
                          alert("Failed to resend verification email")
                        }
                      }}
                      className="underline font-medium hover:no-underline"
                    >
                      Resend verification email
                    </button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}


