"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, ExternalLink } from "lucide-react"

interface InstitutionMapProps {
  name: string
  city: string
  state: string
  address?: string
}

export function InstitutionMap({ name, city, state, address }: InstitutionMapProps) {
  // Construct Google Maps search query
  const searchQuery = address
    ? `${address}, ${city}, ${state}, Nigeria`
    : `${name}, ${city}, ${state}, Nigeria`

  const encodedQuery = encodeURIComponent(searchQuery)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Address</p>
            <p className="text-sm text-muted-foreground">
              {address || `${city}, ${state}, Nigeria`}
            </p>
          </div>

          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <div className="aspect-video bg-muted rounded-md overflow-hidden border">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodedQuery}`}
              />
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-md overflow-hidden border flex items-center justify-center">
              <div className="text-center p-4">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Map preview requires Google Maps API key
                </p>
              </div>
            </div>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Google Maps
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

