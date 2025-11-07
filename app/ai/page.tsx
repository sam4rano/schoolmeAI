"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/protected-route"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isError?: boolean
}

export default function AIPage() {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: "loading" }
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI admission guide. I can help you find the right institutions and programs based on your scores. How can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    // Check if user is authenticated
    if (status !== "authenticated" || !session) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Please sign in to use the AI assistant. Redirecting to sign in page...",
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
      setTimeout(() => {
        window.location.href = "/auth/signin?callbackUrl=/ai"
      }, 2000)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: userInput,
          entityType: "all",
          limit: 5,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error("Session expired. Please sign in again.")
        }
        throw new Error(errorData.error || "Failed to get AI response. Please try again.")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error 
          ? error.message
          : "Sorry, I encountered an error. Please try again or sign in if you haven't already.",
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
      
      // Redirect to sign in if unauthorized
      if (error instanceof Error && (error.message.includes("sign in") || error.message.includes("Session expired"))) {
        setTimeout(() => {
          window.location.href = "/auth/signin?callbackUrl=/ai"
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              AI Assistant
            </h1>
            <p className="text-muted-foreground">
              Get personalized admission guidance powered by AI
            </p>
          </div>

          <Card className="h-[600px] flex flex-col shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chat with AI
              </CardTitle>
              <CardDescription>
                Ask questions about institutions, programs, or admission requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-background to-muted/20">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 items-start ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : message.isError
                          ? "bg-destructive/10 border-2 border-destructive/30 text-destructive rounded-bl-sm"
                          : "bg-background border border-border rounded-bl-sm"
                      }`}
                    >
                      <p className={`text-sm leading-relaxed ${message.isError ? "font-medium" : ""}`}>
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-primary-foreground/60"
                            : message.isError
                            ? "text-destructive/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start items-start">
                    <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t bg-background p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about admissions, programs, or institutions..."
                    disabled={loading}
                    className="flex-1 h-11"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !loading && input.trim()) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    size="default"
                    className="h-11 px-6"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                {status === "authenticated" && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Signed in as {session?.user?.email}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setInput("What are the best universities in Lagos?")}
                >
                  Best universities in Lagos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setInput("What programs can I apply for with 240 UTME score?")}
                >
                  Programs for 240 UTME
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setInput("What are the admission requirements for Medicine?")}
                >
                  Medicine requirements
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Institution recommendations</li>
                  <li>• Program matching</li>
                  <li>• Admission probability</li>
                  <li>• Application guidance</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="mb-2">
                  RAG Pipeline: Active
                </Badge>
                <p className="text-xs text-muted-foreground">
                  AI assistant is fully operational with RAG and LLM integration. Configure OPENAI_API_KEY for enhanced responses.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

