"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, HelpCircle, BookOpen, Plus } from "lucide-react"
import Link from "next/link"
import { ForumList } from "@/components/community/forum-list"
import { QuestionsList } from "@/components/community/questions-list"
import { StoriesList } from "@/components/community/stories-list"

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("forums")

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Community</h1>
              <p className="text-muted-foreground text-lg">
                Connect with other students, ask questions, and share your success stories
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/community/forums/new">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </Link>
              <Link href="/community/questions/new">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ask Question
                </Button>
              </Link>
              <Link href="/community/stories/new">
                <Button variant="default" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Share Story
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forums" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Forums
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Q&A
            </TabsTrigger>
            <TabsTrigger value="stories" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Success Stories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forums" className="mt-6">
            <ForumList />
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <QuestionsList />
          </TabsContent>

          <TabsContent value="stories" className="mt-6">
            <StoriesList />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}

