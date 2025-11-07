"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentLayout } from "@/components/student/student-layout"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { BookOpen, Calculator, Sparkles, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <StudentLayout>
      <div className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.email || "Student"}! Your personalized admission journey overview
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>My Watchlist</CardTitle>
              </div>
              <CardDescription>Programs you&apos;re tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                No programs in your watchlist yet
              </p>
              <Link href="/programs">
                <Button variant="outline" size="sm" className="w-full">
                  Browse Programs
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle>Recent Calculations</CardTitle>
              </div>
              <CardDescription>Your eligibility calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                No calculations yet
              </p>
              <Link href="/calculator">
                <Button variant="outline" size="sm" className="w-full">
                  Calculate Eligibility
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Recommendations</CardTitle>
              </div>
              <CardDescription>Get personalized program recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get AI-powered recommendations based on your scores
              </p>
              <Link href="/recommendations">
                <Button variant="outline" size="sm" className="w-full">
                  Get Recommendations
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>My Profile</CardTitle>
              </div>
              <CardDescription>Account information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your account settings
              </p>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  )
}


