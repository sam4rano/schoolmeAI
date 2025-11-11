"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus("error")
      setMessage("No verification token provided")
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setStatus("loading")
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        setMessage(data.error || "Failed to verify email")
      } else {
        setStatus("success")
        setMessage("Email verified successfully! You can now sign in.")
        setTimeout(() => {
          router.push("/auth/signin?verified=true")
        }, 2000)
      }
    } catch (err) {
      setStatus("error")
      setMessage("An error occurred. Please try again.")
    }
  }

  const resendVerification = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "" }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Verification email sent! Please check your inbox.")
      } else {
        setMessage(data.error || "Failed to resend verification email")
      }
    } catch (err) {
      setMessage("An error occurred. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4">
              {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
              {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
              {status === "error" && <XCircle className="h-12 w-12 text-red-500" />}
              {status === "idle" && <Mail className="h-12 w-12 text-primary" />}
            </div>
            <CardTitle className="text-2xl font-bold">
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
              {status === "idle" && "Verify Your Email"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we verify your email address"}
              {status === "success" && "Your email has been successfully verified"}
              {status === "error" && "We couldn't verify your email address"}
              {status === "idle" && "Click the link in your email to verify"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant={status === "success" ? "default" : "destructive"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <div className="space-y-2">
                <Button onClick={resendVerification} variant="outline" className="w-full">
                  Resend Verification Email
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signin">Go to Sign In</Link>
                </Button>
              </div>
            )}

            {status === "success" && (
              <Button asChild className="w-full">
                <Link href="/auth/signin">Continue to Sign In</Link>
              </Button>
            )}

            {status === "idle" && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signin">Back to Sign In</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

