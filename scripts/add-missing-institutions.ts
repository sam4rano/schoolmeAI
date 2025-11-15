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

// Normalize institution name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

async function addMissingInstitutions() {
  try {
    console.log("Reading accreditation_results.csv...")
    
    const csvPath = path.join(process.cwd(), "csv_folder", "accreditation_results.csv")
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const csvData = parseCSV(csvContent)

    // Get all unique universities from CSV
    const csvUniversities = new Set<string>()
    csvData.forEach((row) => {
      const uniName = row.University?.trim()
      if (uniName) {
        csvUniversities.add(uniName)
      }
    })

    // Get all institutions from database
    const dbInstitutions = await prisma.institution.findMany({
      select: { id: true, name: true },
    })

    // Create normalized name map for database institutions
    const dbInstitutionMap = new Map<string, boolean>()
    dbInstitutions.forEach((inst) => {
      const normalized = normalizeName(inst.name)
      dbInstitutionMap.set(normalized, true)
    })

    // Find missing institutions
    const missingInstitutions: string[] = []
    csvUniversities.forEach((csvUni) => {
      const normalized = normalizeName(csvUni)
      if (!dbInstitutionMap.has(normalized)) {
        missingInstitutions.push(csvUni)
      }
    })

    console.log(`Found ${missingInstitutions.length} missing institutions`)

    if (missingInstitutions.length === 0) {
      console.log("✅ All institutions already exist in database!")
      return
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    const currentDate = new Date()

    console.log("\nAdding missing institutions...")

    for (const uniName of missingInstitutions.sort()) {
      try {
        // Check if it was already added (race condition protection)
        const normalized = normalizeName(uniName)
        const existing = await prisma.institution.findFirst({
          where: {
            name: {
              equals: uniName,
              mode: "insensitive",
            },
          },
          select: { id: true },
        })

        if (existing) {
          results.skipped++
          continue
        }

        // Infer type from name (must match InstitutionType enum)
        let type = "university"
        if (uniName.toLowerCase().includes("polytechnic")) {
          type = "polytechnic"
        } else if (uniName.toLowerCase().includes("college")) {
          type = "college"
        } else if (uniName.toLowerCase().includes("university")) {
          type = "university"
        }

        // Infer ownership from name (must match Ownership enum: federal, state, private)
        let ownership = "private"
        if (uniName.toLowerCase().includes("federal")) {
          ownership = "federal"
        } else if (uniName.toLowerCase().includes("state")) {
          ownership = "state"
        }

        // Create institution with minimal data
        await prisma.institution.create({
          data: {
            name: uniName,
            type: type as any,
            ownership: ownership as any, // federal, state, or private
            state: "Unknown",
            city: "Unknown",
            // Only select existing fields
            accreditationStatus: "Unknown",
            lastVerifiedAt: currentDate,
            dataQualityScore: 30, // Low score since we have minimal data
            missingFields: ["state", "city", "website", "contact", "description"],
            provenance: {
              source_url: "accreditation_results.csv",
              fetched_at: currentDate.toISOString(),
              license: "NUC Official Data",
              note: "Auto-added from accreditation data",
            },
          },
        })

        results.created++
        if (results.created % 50 === 0) {
          console.log(`  Added ${results.created}/${missingInstitutions.length}...`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${uniName}: ${errorMsg}`)
        if (results.errors.length <= 10) {
          console.error(`  Error adding ${uniName}:`, errorMsg)
        }
      }
    }

    console.log("\n✅ Import completed!")
    console.log(`\nResults:`)
    console.log(`  Created: ${results.created}`)
    console.log(`  Skipped: ${results.skipped}`)
    console.log(`  Errors: ${results.errors.length}`)

    if (results.errors.length > 0 && results.errors.length <= 10) {
      console.log(`\nErrors:`)
      results.errors.forEach((error) => {
        console.log(`  - ${error}`)
      })
    }

    if (results.created > 0) {
      console.log(`\n🎉 ${results.created} institutions added!`)
      console.log(`   You can now re-run the program import:`)
      console.log(`   npx tsx scripts/import-programs-from-accreditation.ts`)
    }
  } catch (error) {
    console.error("Error adding missing institutions:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addMissingInstitutions()

