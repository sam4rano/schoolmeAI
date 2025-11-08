import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { z } from "zod"

const approveWebsiteSchema = z.object({
  institutionId: z.string().uuid(),
  website: z.string().url(),
  confidence: z.number().min(0).max(100).optional(),
})

const bulkApproveSchema = z.object({
  institutionIds: z.array(z.string().uuid()),
  minConfidence: z.number().min(0).max(100).optional(),
})

// GET: List institutions with missing websites or pending website matches
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const missingOnly = searchParams.get("missingOnly") === "true"
    const minConfidence = searchParams.get("minConfidence") 
      ? parseFloat(searchParams.get("minConfidence")!) 
      : undefined

    const skip = (page - 1) * limit

    // For now, we'll read from the website_matches.json file
    // In production, you'd store this in a database table
    let matches: any[] = []
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      const matchesPath = path.join(process.cwd(), "scrapers", "website_matches.json")
      const matchesData = await fs.readFile(matchesPath, "utf-8")
      matches = JSON.parse(matchesData)
    } catch (error) {
      // File doesn't exist yet, that's okay
      matches = []
    }

    // Get institutions
    const where: any = {}
    if (missingOnly) {
      where.OR = [
        { website: null },
        { website: "" },
      ]
    }

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          type: true,
          ownership: true,
          state: true,
          city: true,
          website: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.institution.count({ where }),
    ])

    // Match institutions with scraped websites
    const institutionsWithMatches = institutions.map((inst) => {
      const match = matches.find((m) => m.institution_id === inst.id)
      return {
        ...inst,
        suggestedWebsite: match?.website,
        confidence: match?.confidence || 0,
        matchedName: match?.matched_name,
      }
    })

    // Filter by confidence if specified
    const filtered = minConfidence !== undefined
      ? institutionsWithMatches.filter((inst) => inst.confidence >= minConfidence)
      : institutionsWithMatches

    return NextResponse.json({
      data: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      matchesCount: matches.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: Approve a website match
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const data = approveWebsiteSchema.parse(body)

    const institution = await prisma.institution.findUnique({
      where: { id: data.institutionId },
    })

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      )
    }

    // Update institution with website
    const updated = await prisma.institution.update({
      where: { id: data.institutionId },
      data: {
        website: data.website,
      },
    })

    // Log audit event
    const { logAuditEvent } = await import("@/lib/utils/audit-logger")
    await logAuditEvent({
      userId: session.user.id,
      entityType: "institution",
      entityId: institution.id,
      action: "update",
      institutionId: institution.id,
      metadata: {
        field: "website",
        oldValue: institution.website,
        newValue: data.website,
        confidence: data.confidence,
        source: "scraped",
      },
    })

    return NextResponse.json({
      data: updated,
      message: "Website approved and updated successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: Bulk approve websites
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { institutionIds, minConfidence } = bulkApproveSchema.parse(body)

    // Read matches from file
    let matches: any[] = []
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      const matchesPath = path.join(process.cwd(), "scrapers", "website_matches.json")
      const matchesData = await fs.readFile(matchesPath, "utf-8")
      matches = JSON.parse(matchesData)
    } catch (error) {
      return NextResponse.json(
        { error: "No website matches found. Please run the scraper first." },
        { status: 404 }
      )
    }

    // Filter matches by institution IDs and confidence
    const filteredMatches = matches.filter((match) => {
      if (!institutionIds.includes(match.institution_id)) {
        return false
      }
      if (minConfidence !== undefined && (match.confidence || 0) < minConfidence) {
        return false
      }
      return true
    })

    let updated = 0
    const errors: string[] = []

    for (const match of filteredMatches) {
      try {
        await prisma.institution.update({
          where: { id: match.institution_id },
          data: {
            website: match.website,
          },
        })
        updated++

        // Log audit event
        const { logAuditEvent } = await import("@/lib/utils/audit-logger")
        await logAuditEvent({
          userId: session.user.id,
          entityType: "institution",
          entityId: match.institution_id,
          action: "update",
          institutionId: match.institution_id,
          metadata: {
            field: "website",
            newValue: match.website,
            confidence: match.confidence,
            source: "scraped",
            bulk: true,
          },
        })
      } catch (error) {
        errors.push(`Failed to update ${match.institution_name}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully updated ${updated} institutions`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

