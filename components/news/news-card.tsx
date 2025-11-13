"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Eye, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface NewsCardProps {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  category: string
  featured?: boolean
  imageUrl?: string | null
  tags?: string[]
  views?: number
  publishedAt?: Date | string | null
  author?: {
    id: string
    email: string
    profile?: any
  } | null
  className?: string
}

const categoryColors: Record<string, string> = {
  jamb: "bg-blue-500",
  post_utme: "bg-purple-500",
  nursing_schools: "bg-pink-500",
  admission: "bg-green-500",
  nysc: "bg-orange-500",
  general: "bg-gray-500",
  scholarships: "bg-yellow-500",
  cutoff_updates: "bg-red-500",
  accreditation: "bg-indigo-500",
}

const categoryLabels: Record<string, string> = {
  jamb: "JAMB",
  post_utme: "Post UTME",
  nursing_schools: "Nursing Schools",
  admission: "Admission",
  nysc: "NYSC",
  general: "General",
  scholarships: "Scholarships",
  cutoff_updates: "Cutoff Updates",
  accreditation: "Accreditation",
}

export function NewsCard({
  id,
  title,
  slug,
  excerpt,
  category,
  featured,
  imageUrl,
  tags,
  views,
  publishedAt,
  author,
  className,
}: NewsCardProps) {
  const categoryColor = categoryColors[category] || "bg-gray-500"
  const categoryLabel = categoryLabels[category] || category

  const formattedDate = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : null

  const authorName = author?.profile?.name || author?.email?.split("@")[0] || "Admin"

  return (
    <Link href={`/news/${slug}`} className={cn("block h-full", className)}>
      <Card className={cn("h-full transition-all hover:shadow-lg", featured && "border-primary")}>
        {imageUrl && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
            {featured && (
              <Badge className="absolute top-2 right-2" variant="default">
                Featured
              </Badge>
            )}
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={categoryColor} variant="default">
              {categoryLabel}
            </Badge>
            {featured && !imageUrl && (
              <Badge variant="default">Featured</Badge>
            )}
          </div>
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          {excerpt && (
            <CardDescription className="line-clamp-2 mt-2">
              {excerpt}
            </CardDescription>
          )}
        </CardHeader>
        {tags && tags.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {formattedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
            )}
            {views !== undefined && views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{views}</span>
              </div>
            )}
          </div>
          {author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="truncate max-w-[100px]">{authorName}</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}

