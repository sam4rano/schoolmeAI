import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"

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

    // Validate CSV structure (map_program.csv format)
    const requiredFields = [
      "Program ID",
      "Program Name",
      "Institution ID",
      "Institution Name",
      "Institution Type",
      "Institution Ownership",
      "State",
      "City",
    ]
    const firstRow = csvData[0]
    const missingFields = requiredFields.filter((field) => !(field in firstRow))

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }

    const results = {
      institutions: { created: 0, skipped: 0, errors: [] as string[] },
      programs: { created: 0, skipped: 0, errors: [] as string[] },
    }

    // Step 1: Extract and create unique institutions
    const institutionMap = new Map<string, any>()

    for (const row of csvData) {
      const instId = row["Institution ID"]?.trim()
      if (!instId || institutionMap.has(instId)) {
        continue
      }

      institutionMap.set(instId, {
        id: instId,
        name: row["Institution Name"]?.trim() || "",
        type: row["Institution Type"]?.trim() || "university",
        ownership: row["Institution Ownership"]?.trim() || "private",
        state: row["State"]?.trim() || "Unknown",
        city: row["City"]?.trim() || "Unknown",
        website: row["Institution Website"]?.trim() || null,
        accreditationStatus: row["Institution Accreditation Status"]?.trim() || null,
      })
    }

    // Create institutions
    for (const [instId, instData] of institutionMap) {
      try {
        const existing = await prisma.institution.findUnique({
          where: { id: instId },
          select: { id: true },
        })

        if (existing) {
          results.institutions.skipped++
          continue
        }

        await prisma.institution.create({
          data: {
            id: instId,
            name: instData.name,
            type: instData.type as any,
            ownership: instData.ownership as any,
            state: instData.state,
            city: instData.city,
            website: instData.website,
            accreditationStatus: instData.accreditationStatus,
            lastVerifiedAt: new Date(),
            dataQualityScore: 50,
            missingFields: [],
            provenance: {
              source_url: "map_program.csv",
              fetched_at: new Date().toISOString(),
              license: "Restored from backup",
            },
          },
        })

        results.institutions.created++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.institutions.errors.push(`${instData.name}: ${errorMsg}`)
      }
    }

    // Step 2: Create programs
    for (const row of csvData) {
      try {
        const programId = row["Program ID"]?.trim()
        const institutionId = row["Institution ID"]?.trim()

        if (!programId || !institutionId) {
          results.programs.errors.push(`Missing Program ID or Institution ID`)
          continue
        }

        const existing = await prisma.program.findUnique({
          where: { id: programId },
          select: { id: true },
        })

        if (existing) {
          results.programs.skipped++
          continue
        }

        const institution = await prisma.institution.findUnique({
          where: { id: institutionId },
          select: { id: true },
        })

        if (!institution) {
          results.programs.errors.push(`Institution ${institutionId} not found`)
          continue
        }

        const lastVerifiedAt = row["Last Verified At"]?.trim()
          ? new Date(row["Last Verified At"])
          : new Date()

        const accreditationMaturityDate = row["Accreditation Maturity Date"]?.trim()
          ? parseInt(row["Accreditation Maturity Date"])
          : null
        const accreditationLastUpdated = row["Accreditation Last Updated"]?.trim()
          ? new Date(row["Accreditation Last Updated"])
          : null
        const isActive = row["Is Active"]?.trim()?.toLowerCase() === "true"

        const provenance: any = {}
        if (row["Provenance Source"]) provenance.source_url = row["Provenance Source"]
        if (row["Provenance Fetched At"]) provenance.fetched_at = row["Provenance Fetched At"]
        if (row["Provenance License"]) provenance.license = row["Provenance License"]

        await prisma.program.create({
          data: {
            id: programId,
            institutionId: institutionId,
            name: row["Program Name"]?.trim() || "",
            faculty: row["Faculty"]?.trim() || null,
            department: row["Department"]?.trim() || null,
            degreeType: row["Degree Type"]?.trim() || null,
            accreditationStatus: row["Accreditation Status"]?.trim() || null,
            accreditationMaturityDate: accreditationMaturityDate,
            accreditationLastUpdated: accreditationLastUpdated,
            isActive: isActive,
            lastVerifiedAt: lastVerifiedAt,
            dataQualityScore: row["Data Quality Score"] ? parseInt(row["Data Quality Score"]) : 70,
            missingFields: [],
            provenance: Object.keys(provenance).length > 0 ? provenance : null,
          },
        })

        results.programs.created++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.programs.errors.push(errorMsg)
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: "create",
      entityType: "program",
      entityId: "bulk_restore",
      metadata: {
        operation: "restore",
        source: "map_program.csv",
        institutionsCreated: results.institutions.created,
        institutionsSkipped: results.institutions.skipped,
        programsCreated: results.programs.created,
        programsSkipped: results.programs.skipped,
        errors: results.institutions.errors.length + results.programs.errors.length,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Restoration completed",
      results,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

