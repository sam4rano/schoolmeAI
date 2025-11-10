import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { logger } from "@/lib/utils/logger"
import { z } from "zod"

// Parse CSV with proper handling of quoted fields
function parseCSV(text: string): any[] {
  const lines = text.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const data: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""))
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""))

    if (values.length === headers.length) {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ""
      })
      data.push(obj)
    }
  }

  return data
}

const institutionSchema = z.object({
  Name: z.string().min(1),
  Type: z.enum(["university", "polytechnic", "college", "nursing", "military"]),
  Ownership: z.enum(["federal", "state", "private"]),
  State: z.string().min(1).or(z.literal("")),
  City: z.string().min(1).or(z.literal("")),
  Website: z.string().url().optional().nullable().or(z.literal("")),
  "Accreditation Status": z.string().optional().nullable().or(z.literal("")),
  Email: z.string().email().optional().nullable().or(z.literal("")),
  Phone: z.string().optional().nullable().or(z.literal("")),
  Address: z.string().optional().nullable().or(z.literal("")),
  "Source URL": z.string().url().optional().nullable().or(z.literal("")),
  License: z.string().optional().nullable().or(z.literal("")),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 })
    }

    const text = await file.text()
    const csvData = parseCSV(text)

    if (csvData.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 })
    }

    // Validate CSV structure
    const requiredFields = ["Name", "Type", "Ownership", "State", "City"]
    const firstRow = csvData[0]
    const missingFields = requiredFields.filter((field) => !(field in firstRow))

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }

    const results = {
      matched: 0,
      updated: 0,
      created: 0,
      errors: [] as string[],
    }

    // Process each CSV row
    for (const row of csvData) {
      try {
        // Validate row data
        const validatedData = institutionSchema.parse({
          Name: row.Name?.trim() || "",
          Type: row.Type?.trim() || "",
          Ownership: row.Ownership?.trim() || "",
          State: row.State?.trim() || "",
          City: row.City?.trim() || "",
          Website: row.Website?.trim() || null,
          "Accreditation Status": row["Accreditation Status"]?.trim() || null,
          Email: row.Email?.trim() || null,
          Phone: row.Phone?.trim() || null,
          Address: row.Address?.trim() || null,
          "Source URL": row["Source URL"]?.trim() || null,
          License: row.License?.trim() || null,
        })

        const name = validatedData.Name
        const type = validatedData.Type
        const ownership = validatedData.Ownership
        const state = validatedData.State || "Unknown"
        const city = validatedData.City || "Unknown"
        const website = validatedData.Website && validatedData.Website !== "" ? validatedData.Website : null
        const accreditationStatus = validatedData["Accreditation Status"] && validatedData["Accreditation Status"] !== "" ? validatedData["Accreditation Status"] : null

        // Build contact object
        const contact: any = {}
        if (validatedData.Email && validatedData.Email !== "") {
          contact.email = validatedData.Email
        }
        if (validatedData.Phone && validatedData.Phone !== "") {
          contact.phone = validatedData.Phone
        }
        if (validatedData.Address && validatedData.Address !== "") {
          contact.address = validatedData.Address
        }

        // Build provenance object
        const provenance: any = {
          fetched_at: new Date().toISOString(),
        }
        if (validatedData["Source URL"] && validatedData["Source URL"] !== "") {
          provenance.source_url = validatedData["Source URL"]
        }
        if (validatedData.License && validatedData.License !== "") {
          provenance.license = validatedData.License
        }

        // Check if institution already exists
        const existing = await prisma.institution.findFirst({
          where: {
            name: {
              equals: name,
              mode: "insensitive",
            },
            state: state,
          },
        })

        if (existing) {
          // Update existing institution
          await prisma.institution.update({
            where: { id: existing.id },
            data: {
              name,
              type,
              ownership,
              state,
              city,
              website: website || existing.website,
              contact: Object.keys(contact).length > 0 ? { ...(existing.contact as any), ...contact } : existing.contact,
              accreditationStatus: accreditationStatus || existing.accreditationStatus,
              provenance: {
                ...(existing.provenance as any),
                ...provenance,
              },
              lastVerifiedAt: new Date(),
              updatedAt: new Date(),
            },
          })
          results.matched++
          results.updated++
        } else {
          // Create new institution
          await prisma.institution.create({
            data: {
              name,
              type,
              ownership,
              state,
              city,
              website: website || null,
              contact: Object.keys(contact).length > 0 ? contact : null,
              accreditationStatus: accreditationStatus || null,
              provenance: Object.keys(provenance).length > 0 ? provenance : null,
              lastVerifiedAt: new Date(),
              dataQualityScore: calculateQualityScore({
                name,
                type,
                ownership,
                state,
                city,
                website,
                accreditationStatus,
                contact,
              }),
              missingFields: identifyMissingFields({
                name,
                type,
                ownership,
                state,
                city,
                website,
                accreditationStatus,
                contact,
              }),
            },
          })
          results.created++
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        const rowName = row.Name || "Unknown"
        results.errors.push(`${rowName}: ${errorMsg}`)
        logger.error(`Error processing ${rowName}`, error, {
          row,
          endpoint: "/api/admin/institutions/import",
        })
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "institution",
      entityId: "bulk-import",
      action: "create",
      metadata: {
        matched: results.matched,
        updated: results.updated,
        created: results.created,
        errors: results.errors.length,
      },
    })

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${csvData.length} records: ${results.matched} matched, ${results.updated} updated, ${results.created} created`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function calculateQualityScore(data: any): number {
  let score = 0
  const required = ["name", "type", "ownership", "state", "city"]
  const optional = ["website", "accreditationStatus", "email", "phone"]

  for (const field of required) {
    if (data[field]) score += 15
  }

  for (const field of optional) {
    if (data[field] || (data.contact && data.contact[field])) {
      score += 5
    }
  }

  return Math.min(100, score)
}

function identifyMissingFields(data: any): string[] {
  const optional = ["website", "accreditationStatus", "email", "phone", "address"]
  const missing: string[] = []

  for (const field of optional) {
    if (!data[field] && (!data.contact || !data.contact[field])) {
      missing.push(field)
    }
  }

  return missing
}

