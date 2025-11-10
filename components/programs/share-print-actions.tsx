"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Share2, Copy, Mail, Facebook, Twitter, Linkedin, Printer, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SharePrintActionsProps {
  programId: string
  programName: string
  institutionName: string
}

export function SharePrintActions({
  programId,
  programName,
  institutionName,
}: SharePrintActionsProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const programUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/programs/${programId}`
    : ""

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(programUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Program link has been copied to clipboard",
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
    const subject = encodeURIComponent(`Check out ${programName} at ${institutionName}`)
    const body = encodeURIComponent(
      `I found this program that might interest you:\n\n${programName}\n${institutionName}\n\nView details: ${programUrl}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(programUrl)}`
    window.open(url, "_blank", "width=600,height=400")
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${programName} at ${institutionName}`)
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(programUrl)}`
    window.open(url, "_blank", "width=600,height=400")
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(programUrl)}`
    window.open(url, "_blank", "width=600,height=400")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleShareFacebook}>
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareTwitter}>
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareLinkedIn}>
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  )
}

