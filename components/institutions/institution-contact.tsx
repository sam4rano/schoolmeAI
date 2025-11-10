"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, Globe, MapPin, ExternalLink } from "lucide-react"

interface InstitutionContactProps {
  name: string
  website?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city: string
  state: string
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  } | null
}

export function InstitutionContact({
  name,
  website,
  email,
  phone,
  address,
  city,
  state,
  socialMedia,
}: InstitutionContactProps) {
  const hasContactInfo = website || email || phone || address
  const hasSocialMedia = socialMedia && Object.keys(socialMedia).length > 0

  if (!hasContactInfo && !hasSocialMedia) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        {(address || city) && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Address</p>
              <p className="text-sm text-muted-foreground">
                {address || `${city}, ${state}, Nigeria`}
              </p>
            </div>
          </div>
        )}

        {/* Website */}
        {website && (
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Website</p>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {website.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Email</p>
              <a
                href={`mailto:${email}`}
                className="text-sm text-primary hover:underline"
              >
                {email}
              </a>
            </div>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Phone</p>
              <a
                href={`tel:${phone}`}
                className="text-sm text-primary hover:underline"
              >
                {phone}
              </a>
            </div>
          </div>
        )}

        {/* Social Media */}
        {hasSocialMedia && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Social Media</p>
            <div className="flex flex-wrap gap-2">
              {socialMedia.facebook && (
                <a
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <span>Facebook</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {socialMedia.twitter && (
                <a
                  href={socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <span>Twitter</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {socialMedia.instagram && (
                <a
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <span>Instagram</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {socialMedia.linkedin && (
                <a
                  href={socialMedia.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {socialMedia.youtube && (
                <a
                  href={socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <span>YouTube</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

