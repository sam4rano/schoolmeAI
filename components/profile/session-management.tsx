"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, LogOut, AlertTriangle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  deviceInfo: string | null
  userAgent: string | null
  ipAddress: string | null
  createdAt: string
  lastActiveAt: string | null
  expires: string
}

const SESSION_WARNING_TIME = 5 * 60 * 1000 // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000 // Check every minute

export function SessionManagement() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState<string | null>(null)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    fetchSessions()
    
    // Check for session timeout
    const checkInterval = setInterval(() => {
      checkSessionTimeout()
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(checkInterval)
  }, [session])

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/auth/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkSessionTimeout = () => {
    if (!session?.expires) return

    const expiresAt = new Date(session.expires).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    if (timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_WARNING_TIME) {
      setShowTimeoutWarning(true)
      setTimeRemaining(Math.floor(timeUntilExpiry / 1000))
    } else if (timeUntilExpiry <= 0) {
      // Session expired
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      })
      signOut({ callbackUrl: "/auth/signin" })
    } else {
      setShowTimeoutWarning(false)
    }
  }

  const handleSignOut = async (sessionId?: string) => {
    if (sessionId) {
      setSigningOut(sessionId)
      try {
        const response = await fetch(`/api/auth/sessions?sessionId=${sessionId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          toast({
            title: "Success",
            description: "Session signed out successfully",
          })
          fetchSessions()
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to sign out session",
          variant: "destructive",
        })
      } finally {
        setSigningOut(null)
      }
    } else {
      // Sign out current session
      await signOut({ callbackUrl: "/" })
    }
  }

  const handleSignOutAll = async () => {
    if (!confirm("Are you sure you want to sign out from all devices? You will need to sign in again.")) {
      return
    }

    setSigningOut("all")
    try {
      const response = await fetch("/api/auth/sessions?all=true", {
        method: "DELETE",
      })
      if (response.ok) {
        toast({
          title: "Success",
          description: "Signed out from all devices",
        })
        // Sign out current session
        await signOut({ callbackUrl: "/auth/signin" })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out from all devices",
        variant: "destructive",
      })
    } finally {
      setSigningOut(null)
    }
  }

  const formatDeviceInfo = (session: Session) => {
    if (session.deviceInfo) return session.deviceInfo
    
    const ua = session.userAgent || ""
    if (ua.includes("Mobile")) return "Mobile Device"
    if (ua.includes("Tablet")) return "Tablet"
    if (ua.includes("Windows")) return "Windows"
    if (ua.includes("Mac")) return "Mac"
    if (ua.includes("Linux")) return "Linux"
    return "Unknown Device"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Update time remaining every second when warning is shown
  useEffect(() => {
    if (!showTimeoutWarning || !timeRemaining) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          setShowTimeoutWarning(false)
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showTimeoutWarning, timeRemaining])

  return (
    <div className="space-y-6">
      {/* Session Timeout Warning */}
      {showTimeoutWarning && timeRemaining !== null && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Session Expiring Soon</AlertTitle>
          <AlertDescription>
            Your session will expire in {formatTime(timeRemaining)}. Please save your work and sign in again if needed.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across different devices
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              onClick={handleSignOutAll}
              disabled={signingOut === "all"}
            >
              {signingOut === "all" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out All Devices
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No active sessions found
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((sessionItem) => {
                const isCurrentSession = sessionItem.id === session?.user?.id
                const createdAt = new Date(sessionItem.createdAt)
                const lastActive = sessionItem.lastActiveAt
                  ? new Date(sessionItem.lastActiveAt)
                  : null

                return (
                  <Card key={sessionItem.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {formatDeviceInfo(sessionItem)}
                            </h4>
                            {isCurrentSession && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                Current Session
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {sessionItem.ipAddress && (
                              <p>IP: {sessionItem.ipAddress}</p>
                            )}
                            <p>
                              Created: {createdAt.toLocaleString()}
                            </p>
                            {lastActive && (
                              <p>
                                Last active: {lastActive.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {!isCurrentSession && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSignOut(sessionItem.id)}
                            disabled={signingOut === sessionItem.id}
                          >
                            {signingOut === sessionItem.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

