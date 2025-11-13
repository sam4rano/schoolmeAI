"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Loader2, Shield, User, Mail, Calendar, ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface UserDetail {
  id: string
  email: string
  roles: string[]
  profile: any
  createdAt: string
  updatedAt: string
  stats: {
    watchlistItems: number
    calculations: number
    reviews: number
    questions: number
    answers: number
    forumPosts: number
    forumComments: number
    userStories: number
    notifications: number
  }
}

export default function AdminUserDetailPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingRoles, setEditingRoles] = useState<string[]>([])

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch user")
      const data = await response.json()
      setUser(data.data)
      setEditingRoles(data.data.roles || [])
    } catch (error) {
      console.error("Error fetching user:", error)
      toast({
        title: "Error",
        description: "Failed to load user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, toast])

  useEffect(() => {
    if (params.id) {
      fetchUser()
    }
  }, [params.id, fetchUser])

  const handleSaveRoles = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roles: editingRoles,
        }),
      })
      if (!response.ok) throw new Error("Failed to update user")
      toast({
        title: "Success",
        description: "User roles updated successfully",
      })
      setEditDialogOpen(false)
      fetchUser()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user roles",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete user")
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      router.push("/admin/users")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const toggleRole = (role: string) => {
    if (editingRoles.includes(role)) {
      setEditingRoles(editingRoles.filter((r) => r !== role))
    } else {
      setEditingRoles([...editingRoles, role])
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">User not found</p>
          <Link href="/admin/users">
            <Button variant="outline">Back to Users</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const profile = user.profile || {}

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="gap-2 mb-4">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Users
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mb-2">User Details</h1>
              <p className="text-muted-foreground">
                View and manage user information
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingRoles([...user.roles])
                  setEditDialogOpen(true)
                }}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Roles
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>User account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Roles</p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>User profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.name ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">{profile.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No name provided</p>
                )}
                {profile.stateOfOrigin && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">State of Origin</p>
                      <p className="text-sm text-muted-foreground">{profile.stateOfOrigin}</p>
                    </div>
                  </div>
                )}
                {profile.dateOfBirth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Date of Birth</p>
                      <p className="text-sm text-muted-foreground">{profile.dateOfBirth}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
                <CardDescription>Activity and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.watchlistItems}</p>
                    <p className="text-sm text-muted-foreground">Watchlist Items</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.calculations}</p>
                    <p className="text-sm text-muted-foreground">Calculations</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.reviews}</p>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.questions}</p>
                    <p className="text-sm text-muted-foreground">Questions</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.answers}</p>
                    <p className="text-sm text-muted-foreground">Answers</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.forumPosts}</p>
                    <p className="text-sm text-muted-foreground">Forum Posts</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.forumComments}</p>
                    <p className="text-sm text-muted-foreground">Forum Comments</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border bg-card">
                    <p className="text-2xl font-bold">{user.stats.notifications}</p>
                    <p className="text-sm text-muted-foreground">Notifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Roles</DialogTitle>
              <DialogDescription>
                Update roles for {user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-user"
                      checked={editingRoles.includes("user")}
                      onCheckedChange={() => toggleRole("user")}
                    />
                    <Label htmlFor="role-user" className="cursor-pointer">
                      User
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-admin"
                      checked={editingRoles.includes("admin")}
                      onCheckedChange={() => toggleRole("admin")}
                    />
                    <Label htmlFor="role-admin" className="cursor-pointer">
                      Admin
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoles}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {user.email}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  )
}

