import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

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

async function importInstitutions() {
  try {
    const csvPath = path.join(process.cwd(), "csv_folder", "all_institutions.csv")
    const csvText = fs.readFileSync(csvPath, "utf-8")
    const csvData = parseCSV(csvText)

    console.log(`Found ${csvData.length} institutions in CSV`)

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    for (const row of csvData) {
      try {
        const name = (row.Name?.trim() || "").replace(/^"|"$/g, "")
        const type = (row.Type?.trim() || "").toLowerCase()
        const ownership = (row.Ownership?.trim() || "").toLowerCase()
        const state = row.State?.trim() || "Unknown"
        const city = row.City?.trim() || "Unknown"
        const website = row.Website?.trim() || null
        const accreditationStatus = row["Accreditation Status"]?.trim() || null

        if (!name || !type || !ownership) {
          results.errors.push(`Skipping row: missing required fields (name: ${name}, type: ${type}, ownership: ${ownership})`)
          continue
        }

        // Validate type and ownership
        if (!["university", "polytechnic", "college", "nursing", "military"].includes(type)) {
          results.errors.push(`Skipping ${name}: invalid type ${type}`)
          continue
        }

        if (!["federal", "state", "private"].includes(ownership)) {
          results.errors.push(`Skipping ${name}: invalid ownership ${ownership}`)
          continue
        }

        // Build contact object
        const contact: any = {}
        if (row.Email?.trim()) {
          contact.email = row.Email.trim()
        }
        if (row.Phone?.trim()) {
          contact.phone = row.Phone.trim()
        }
        if (row.Address?.trim()) {
          contact.address = row.Address.trim()
        }

        // Build provenance object
        const provenance: any = {
          fetched_at: new Date().toISOString(),
        }
        if (row["Source URL"]?.trim()) {
          provenance.source_url = row["Source URL"].trim()
        }
        if (row.License?.trim()) {
          provenance.license = row.License.trim()
        }

        // Check if institution exists (using select to avoid non-existent fields)
        const existing = await prisma.institution.findFirst({
          where: {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            name: true,
            type: true,
            ownership: true,
            state: true,
            city: true,
            website: true,
            contact: true,
            accreditationStatus: true,
            provenance: true,
          },
        })

        if (existing) {
          // Update existing
          await prisma.institution.update({
            where: { id: existing.id },
            data: {
              type: type as any,
              ownership: ownership as any,
              state,
              city,
              website: website && website !== "" ? website : null,
              accreditationStatus: accreditationStatus && accreditationStatus !== "" ? accreditationStatus : null,
              contact: Object.keys(contact).length > 0 ? contact : null,
              provenance: Object.keys(provenance).length > 0 ? provenance : null,
            },
          })
          results.updated++
        } else {
          // Create new
          await prisma.institution.create({
            data: {
              name,
              type: type as any,
              ownership: ownership as any,
              state,
              city,
              website: website && website !== "" ? website : null,
              accreditationStatus: accreditationStatus && accreditationStatus !== "" ? accreditationStatus : null,
              contact: Object.keys(contact).length > 0 ? contact : null,
              provenance: Object.keys(provenance).length > 0 ? provenance : null,
            },
          })
          results.created++
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`Error processing ${row.Name || "unknown"}: ${errorMsg}`)
        console.error(`Error processing row:`, error)
      }
    }

    console.log("\n=== Import Results ===")
    console.log(`Created: ${results.created}`)
    console.log(`Updated: ${results.updated}`)
    console.log(`Errors: ${results.errors.length}`)
    if (results.errors.length > 0) {
      console.log("\nFirst 10 errors:")
      results.errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`))
    }
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importInstitutions()

