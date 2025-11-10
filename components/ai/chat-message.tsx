"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isError?: boolean
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={`flex gap-3 items-start ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
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
            isUser
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

      {isUser && (
        <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
