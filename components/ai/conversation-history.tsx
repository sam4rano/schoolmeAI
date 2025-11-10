"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Trash2 } from "lucide-react"

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

interface ConversationHistoryProps {
  conversations: Conversation[]
  currentConversationId: string | null
  showHistory: boolean
  onClose: () => void
  onLoadConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function ConversationHistory({
  conversations,
  currentConversationId,
  showHistory,
  onClose,
  onLoadConversation,
  onDeleteConversation,
}: ConversationHistoryProps) {
  if (!showHistory) return null

  return (
    <Card className="lg:w-64 h-[600px] flex flex-col">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Conversations</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                  currentConversationId === conv.id ? "bg-muted" : ""
                }`}
                onClick={() => onLoadConversation(conv.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.messages.length} messages
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conv.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(conv.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

