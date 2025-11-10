"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Download, History, Sparkles, Loader2, Send, User } from "lucide-react"
import { ChatMessage } from "@/components/ai/chat-message"
import { ChatInput } from "@/components/ai/chat-input"
import { ConversationHistory } from "@/components/ai/conversation-history"
import { SuggestedQuestions } from "@/components/ai/suggested-questions"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isError?: boolean
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = "ai-chat-conversations"
const GUEST_MESSAGE_LIMIT = 5

const SUGGESTED_QUESTIONS = [
  "What are the best universities in Lagos?",
  "What programs can I apply for with 240 UTME score?",
  "What are the admission requirements for Medicine?",
  "Which universities offer Computer Science?",
  "What is the cutoff mark for Law at UNILAG?",
  "How do I calculate my admission probability?",
  "What are the best polytechnics in Nigeria?",
  "Which institutions offer Nursing programs?",
]

export default function AIPage() {
  const { toast } = useToast()
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: "loading" }
  const isAuthenticated = status === "authenticated" && !!session
  const isGuest = !isAuthenticated
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: isGuest 
        ? "Hello! I'm your AI admission guide. You're using guest mode with limited features. Sign in for full access to conversation history and unlimited messages. How can I assist you today?"
        : "Hello! I'm your AI admission guide. I can help you find the right institutions and programs based on your scores. How can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const conversationsWithDates = parsed.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }))
          setConversations(conversationsWithDates)
        }
      } catch (error) {
        console.error("Error loading conversations:", error)
      }
    } else {
      // Load guest message count
      try {
        const count = localStorage.getItem("ai-chat-guest-count")
        if (count) {
          setGuestMessageCount(parseInt(count, 10))
        }
      } catch (error) {
        console.error("Error loading guest count:", error)
      }
    }
  }, [isAuthenticated])

  // Save conversations to localStorage
  const saveConversation = useCallback((conversation: Conversation) => {
    if (!isAuthenticated) return
    
    try {
      const updated = conversations.filter((c) => c.id !== conversation.id)
      updated.unshift(conversation)
      // Keep only last 20 conversations
      const limited = updated.slice(0, 20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
      setConversations(limited)
    } catch (error) {
      console.error("Error saving conversation:", error)
    }
  }, [isAuthenticated, conversations])

  // Create or update current conversation
  const updateCurrentConversation = useCallback(() => {
    if (!isAuthenticated) return
    
    const conversation: Conversation = {
      id: currentConversationId || `conv-${Date.now()}`,
      title: messages.length > 1 
        ? messages.find((m) => m.role === "user")?.content.slice(0, 50) || "New Conversation"
        : "New Conversation",
      messages,
      createdAt: currentConversationId 
        ? conversations.find((c) => c.id === currentConversationId)?.createdAt || new Date()
        : new Date(),
      updatedAt: new Date(),
    }
    
    setCurrentConversationId(conversation.id)
    saveConversation(conversation)
  }, [isAuthenticated, currentConversationId, messages, conversations, saveConversation])

  // Load conversation
  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (conversation) {
      setMessages(conversation.messages)
      setCurrentConversationId(conversationId)
      setShowHistory(false)
    }
  }

  // Start new conversation
  const startNewConversation = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: isGuest 
          ? "Hello! I'm your AI admission guide. You're using guest mode with limited features. Sign in for full access to conversation history and unlimited messages. How can I assist you today?"
          : "Hello! I'm your AI admission guide. I can help you find the right institutions and programs based on your scores. How can I assist you today?",
        timestamp: new Date(),
      },
    ])
    setCurrentConversationId(null)
    setShowHistory(false)
  }

  // Delete conversation
  const deleteConversation = (conversationId: string) => {
    const updated = conversations.filter((c) => c.id !== conversationId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setConversations(updated)
    if (currentConversationId === conversationId) {
      startNewConversation()
    }
    toast({
      title: "Success",
      description: "Conversation deleted",
    })
  }

  // Export conversation
  const exportConversation = () => {
    const data = {
      title: currentConversationId 
        ? conversations.find((c) => c.id === currentConversationId)?.title || "Conversation"
        : "Conversation",
      messages,
      exportedAt: new Date().toISOString(),
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-chat-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Success",
      description: "Conversation exported",
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Save conversation when messages change
  useEffect(() => {
    if (isAuthenticated && messages.length > 1) {
      updateCurrentConversation()
    }
  }, [messages, isAuthenticated, updateCurrentConversation])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    // Check guest message limit
    if (isGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      toast({
        title: "Message Limit Reached",
        description: `Guest users can send up to ${GUEST_MESSAGE_LIMIT} messages. Please sign in for unlimited access.`,
        variant: "destructive",
      })
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
      // Build conversation context from recent messages
      const recentMessages = messages.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

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
          conversationHistory: recentMessages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error("Session expired. Please sign in again.")
        }
        // Use detailed error message if available, otherwise use generic message
        const errorMessage = errorData.error || "Failed to get AI response. Please try again."
        const errorDetails = errorData.details ? `\n\nDetails: ${errorData.details}` : ""
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      
      // Update guest message count
      if (isGuest) {
        const newCount = guestMessageCount + 1
        setGuestMessageCount(newCount)
        localStorage.setItem("ai-chat-guest-count", newCount.toString())
      }
    } catch (error) {
      console.error("Error sending message:", error)
      let errorContent = "Sorry, I encountered an error. Please try again or sign in if you haven't already."
      
      if (error instanceof Error) {
        errorContent = error.message
        
        // Show toast for configuration errors
        if (error.message.includes("API_KEY") || error.message.includes("configuration")) {
          toast({
            title: "Configuration Error",
            description: "The AI service is not properly configured. Please contact support.",
            variant: "destructive",
          })
        } else if (error.message.includes("Database") || error.message.includes("embeddings")) {
          toast({
            title: "Database Error",
            description: "The database may need to be set up. Please run migrations.",
            variant: "destructive",
          })
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
      
      // Handle unauthorized errors
      if (error instanceof Error && (error.message.includes("sign in") || error.message.includes("Session expired"))) {
        if (isGuest) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to continue using the AI assistant.",
            variant: "destructive",
          })
        } else {
          setTimeout(() => {
            window.location.href = "/auth/signin?callbackUrl=/ai"
          }, 2000)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                AI Assistant
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Get personalized admission guidance powered by AI
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isGuest && (
                <Badge variant="outline" className="text-xs">
                  Guest Mode ({GUEST_MESSAGE_LIMIT - guestMessageCount} messages left)
                </Badge>
              )}
              {isAuthenticated && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    History ({conversations.length})
                  </Button>
                  {messages.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportConversation}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewConversation}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </>
              )}
              {isGuest && (
                <Link href="/auth/signin?callbackUrl=/ai">
                  <Button variant="default" size="sm">
                    Sign In for Full Access
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          {isGuest && (
            <Alert className="mb-4">
              <AlertDescription>
                You&apos;re using guest mode. Sign in to access conversation history, unlimited messages, and more features.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-4 flex-col lg:flex-row mb-6">
          {/* Conversation History Sidebar */}
          <ConversationHistory
            conversations={conversations}
            currentConversationId={currentConversationId}
            showHistory={isAuthenticated && showHistory}
            onClose={() => setShowHistory(false)}
            onLoadConversation={loadConversation}
            onDeleteConversation={deleteConversation}
          />

          {/* Main Chat Card */}
          <Card className={`${isAuthenticated && showHistory ? "lg:flex-1" : "w-full"} max-h-[600px] min-h-[500px] flex flex-col shadow-lg`}>
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bot className="h-5 w-5 text-primary" />
                Chat with AI
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Ask questions about institutions, programs, or admission requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-background to-muted/20 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
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
              <div className="flex-shrink-0 border-t bg-background">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  loading={loading}
                  disabled={isGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT}
                  placeholder="Ask me anything about admissions, programs, or institutions..."
                />
                {isAuthenticated && (
                  <p className="text-xs text-muted-foreground mt-2 text-center px-4 pb-2">
                    Signed in as {session?.user?.email}
                  </p>
                )}
                {isGuest && (
                  <p className="text-xs text-muted-foreground mt-2 text-center px-4 pb-2">
                    Guest Mode • {GUEST_MESSAGE_LIMIT - guestMessageCount} messages remaining
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggested Questions */}
        <SuggestedQuestions
          onSelectQuestion={setInput}
          loading={loading}
          disabled={isGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT}
          show={messages.length === 1}
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

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
  )
}

