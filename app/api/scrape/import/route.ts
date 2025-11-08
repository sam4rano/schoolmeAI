import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"

const institutionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["university", "polytechnic", "college", "nursing", "military"]),
  ownership: z.enum(["federal", "state", "private"]),
  state: z.string().min(1).or(z.literal("")),
  city: z.string().min(1).or(z.literal("")),
  website: z.string().url().optional().nullable(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  accreditationStatus: z.string().optional().nullable(),
  year_established: z.number().int().min(1800).max(2100).optional().nullable(),
  courses_url: z
    .union([z.string().url(), z.string().length(0), z.null()])
    .optional()
    .nullable(),
  source_url: z
    .union([z.string().url(), z.string().length(0)])
    .optional(),
  license: z.string().optional(),
})

const importSchema = z.object({
  institutions: z.array(institutionSchema),
  source: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = importSchema.parse(body)

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    for (const instData of validatedData.institutions) {
      try {
        // Check if institution already exists
        const existing = await prisma.institution.findFirst({
          where: {
            name: {
              equals: instData.name,
              mode: "insensitive",
            },
            state: instData.state,
          },
        })

        const provenance = {
          source_url: instData.source_url || "",
          fetched_at: new Date().toISOString(),
          license: instData.license || "Unknown",
        }

        const contact = instData.contact || {}

        // Use defaults for empty state/city
        const state = instData.state || "Unknown"
        const city = instData.city || "Unknown"

        if (existing) {
          // Update existing institution
          await prisma.institution.update({
            where: { id: existing.id },
            data: {
              name: instData.name,
              type: instData.type,
              ownership: instData.ownership,
              state: state,
              city: city,
              website: instData.website || existing.website,
              contact: {
                ...(existing.contact as any),
                ...contact,
              },
              accreditationStatus: instData.accreditationStatus || existing.accreditationStatus,
              provenance: {
                ...(existing.provenance as any),
                ...provenance,
              },
              lastVerifiedAt: new Date(),
              updatedAt: new Date(),
            },
          })
          results.updated++
        } else {
          // Create new institution
          await prisma.institution.create({
            data: {
              name: instData.name,
              type: instData.type,
              ownership: instData.ownership,
              state: state,
              city: city,
              website: instData.website || null,
              contact: contact,
              accreditationStatus: instData.accreditationStatus || null,
              provenance: provenance,
              lastVerifiedAt: new Date(),
              dataQualityScore: calculateQualityScore(instData),
              missingFields: identifyMissingFields(instData),
            },
          })
          results.created++
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${instData.name}: ${errorMsg}`)
        logger.error(`Error importing ${instData.name}`, error, {
          endpoint: "/api/scrape/import",
          method: "POST",
          institutionName: instData.name,
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.created} new institutions, updated ${results.updated} existing institutions`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error importing institutions", error, {
      endpoint: "/api/scrape/import",
      method: "POST",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateQualityScore(data: any): number {
  let score = 0
  const required = ["name", "type", "ownership", "state", "city"]
  const optional = ["website", "contact", "accreditationStatus"]

  for (const field of required) {
    if (data[field]) score += 15
  }

  for (const field of optional) {
    if (data[field]) score += 5
  }

  return Math.min(100, score)
}

function identifyMissingFields(data: any): string[] {
  const required = ["name", "type", "ownership", "state", "city"]
  const optional = ["website", "email", "phone", "accreditationStatus"]
  const missing: string[] = []

  for (const field of required) {
    if (!data[field]) missing.push(field)
  }

  for (const field of optional) {
    if (!data[field] && !data.contact?.[field]) missing.push(field)
  }

  return missing
}

