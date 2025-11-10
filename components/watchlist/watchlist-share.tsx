"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Check, Mail, Facebook, Twitter, Linkedin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WatchlistShareProps {
  watchlistItems: any[]
}

export function WatchlistShare({ watchlistItems }: WatchlistShareProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/watchlist/shared?ids=${watchlistItems.map((item) => item.id).join(",")}`
    : ""

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Watchlist link has been copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent("My Program Watchlist")
    const body = encodeURIComponent(
      `I wanted to share my program watchlist with you:\n\n${watchlistItems
        .map((item, index) => `${index + 1}. ${item.program.name} at ${item.program.institution.name}`)
        .join("\n")}\n\nView full details: ${shareUrl}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank", "width=600,height=400")
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Check out my program watchlist: ${watchlistItems.length} programs I'm tracking!`
    )
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank", "width=600,height=400")
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank", "width=600,height=400")
  }

  if (watchlistItems.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share Watchlist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Watchlist</DialogTitle>
          <DialogDescription>
            Share your watchlist with others
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} variant="outline" size="icon">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share via</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleShareEmail} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" onClick={handleShareFacebook} className="w-full">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" onClick={handleShareTwitter} className="w-full">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" onClick={handleShareLinkedIn} className="w-full">
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
            <p className="font-semibold mb-1">Watchlist Summary:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{watchlistItems.length} program(s)</li>
              <li>
                {watchlistItems.filter((item) => item.priority === "high").length} high priority
              </li>
              <li>
                {watchlistItems.filter((item) => item.program?.applicationDeadline).length} with
                deadlines
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

