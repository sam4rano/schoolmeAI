"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  loading: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  input,
  setInput,
  onSend,
  loading,
  disabled = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!loading && !disabled && input.trim()) {
        onSend()
      }
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!loading && !disabled && input.trim()) {
            onSend()
          }
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={loading || disabled}
          className="flex-1 h-11"
        />
        <Button
          type="submit"
          disabled={loading || disabled || !input.trim()}
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
    </div>
  )
}
