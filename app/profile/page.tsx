"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Calendar, MapPin, Save, Loader2 } from "lucide-react"
import { NotificationPreferences } from "@/components/profile/notification-preferences"
import { ScoresManagement } from "@/components/profile/scores-management"
import { SessionManagement } from "@/components/profile/session-management"

export default function ProfilePage() {
  const sessionResult = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    stateOfOrigin: "",
    dateOfBirth: "",
    jambScore: null as number | null,
  })
  const [oLevels, setOLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { data: session, status } = sessionResult || { data: null, status: "loading" }

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchProfile()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile")
      if (!response.ok) throw new Error("Failed to fetch profile")
      const data = await response.json()
      setProfile({
        name: data.data?.name || "",
        email: data.data?.email || "",
        stateOfOrigin: data.data?.stateOfOrigin || "",
        dateOfBirth: data.data?.dateOfBirth || "",
        jambScore: data.data?.jambScore || null,
      })
      setOLevels(data.data?.oLevels || [])
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          stateOfOrigin: profile.stateOfOrigin,
          dateOfBirth: profile.dateOfBirth,
        }),
      })
      if (!response.ok) throw new Error("Failed to save profile")
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        className="pl-10"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stateOfOrigin">State of Origin</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="stateOfOrigin"
                        value={profile.stateOfOrigin}
                        onChange={(e) =>
                          setProfile({ ...profile, stateOfOrigin: e.target.value })
                        }
                        className="pl-10"
                        placeholder="Enter your state of origin"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) =>
                          setProfile({ ...profile, dateOfBirth: e.target.value })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                        {saving ? (
                          <>
                            <Save className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scores">
              <ScoresManagement
                jambScore={profile.jambScore}
                oLevels={oLevels}
                onJambScoreUpdate={(score) => setProfile({ ...profile, jambScore: score })}
                onOLevelsUpdate={fetchProfile}
              />
            </TabsContent>

            <TabsContent value="sessions">
              <SessionManagement />
            </TabsContent>

            <TabsContent value="preferences">
              <NotificationPreferences />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

