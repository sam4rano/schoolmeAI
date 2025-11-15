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

async function restoreFromMapCSV() {
  try {
    console.log("Reading map_program.csv...")
    
    const csvPath = path.join(process.cwd(), "csv_folder", "map_program.csv")
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`)
      process.exit(1)
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const csvData = parseCSV(csvContent)

    console.log(`Found ${csvData.length} program records in CSV`)

    if (csvData.length === 0) {
      console.error("❌ CSV file is empty or invalid")
      process.exit(1)
    }

    // Step 1: Extract unique institutions and create them
    console.log("\n📋 Step 1: Extracting and creating institutions...")
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

    console.log(`Found ${institutionMap.size} unique institutions`)

    const institutionResults = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Create institutions
    for (const [instId, instData] of institutionMap) {
      try {
        // Check if institution already exists
        const existing = await prisma.institution.findUnique({
          where: { id: instId },
          select: { id: true },
        })

        if (existing) {
          institutionResults.skipped++
          continue
        }

        // Create institution
        await prisma.institution.create({
          data: {
            id: instId, // Use original ID if provided
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

        institutionResults.created++
        if (institutionResults.created % 50 === 0) {
          console.log(`  Created ${institutionResults.created}/${institutionMap.size} institutions...`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        institutionResults.errors.push(`${instData.name}: ${errorMsg}`)
        if (institutionResults.errors.length <= 10) {
          console.error(`  Error creating ${instData.name}:`, errorMsg)
        }
      }
    }

    console.log(`\n✅ Institutions: ${institutionResults.created} created, ${institutionResults.skipped} skipped, ${institutionResults.errors.length} errors`)

    // Step 2: Create programs
    console.log("\n📋 Step 2: Creating programs...")
    
    const programResults = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      if (i % 500 === 0) {
        console.log(`  Processing ${i + 1}/${csvData.length} programs...`)
      }

      try {
        const programId = row["Program ID"]?.trim()
        const institutionId = row["Institution ID"]?.trim()

        if (!programId || !institutionId) {
          programResults.errors.push(`Row ${i + 1}: Missing Program ID or Institution ID`)
          continue
        }

        // Check if program already exists
        const existing = await prisma.program.findUnique({
          where: { id: programId },
          select: { id: true },
        })

        if (existing) {
          programResults.skipped++
          continue
        }

        // Verify institution exists
        const institution = await prisma.institution.findUnique({
          where: { id: institutionId },
          select: { id: true },
        })

        if (!institution) {
          programResults.errors.push(`Row ${i + 1}: Institution ${institutionId} not found`)
          continue
        }

        // Parse dates
        const lastVerifiedAt = row["Last Verified At"]?.trim()
          ? new Date(row["Last Verified At"])
          : new Date()

        // Parse provenance
        const provenance: any = {}
        if (row["Provenance Source"]) {
          provenance.source_url = row["Provenance Source"]
        }
        if (row["Provenance Fetched At"]) {
          provenance.fetched_at = row["Provenance Fetched At"]
        }
        if (row["Provenance License"]) {
          provenance.license = row["Provenance License"]
        }

        // Parse accreditation fields
        const accreditationMaturityDate = row["Accreditation Maturity Date"]?.trim()
          ? parseInt(row["Accreditation Maturity Date"])
          : null
        const accreditationLastUpdated = row["Accreditation Last Updated"]?.trim()
          ? new Date(row["Accreditation Last Updated"])
          : null
        const isActive = row["Is Active"]?.trim()?.toLowerCase() === "true"

        // Create program
        await prisma.program.create({
          data: {
            id: programId, // Use original ID if provided
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

        programResults.created++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        programResults.errors.push(`Row ${i + 1}: ${errorMsg}`)
        if (programResults.errors.length <= 10) {
          console.error(`  Error processing row ${i + 1}:`, errorMsg)
        }
      }
    }

    console.log(`\n✅ Programs: ${programResults.created} created, ${programResults.skipped} skipped, ${programResults.errors.length} errors`)

    // Summary
    console.log("\n" + "=".repeat(60))
    console.log("✅ RESTORATION COMPLETE!")
    console.log("=".repeat(60))
    console.log(`\nInstitutions:`)
    console.log(`  Created: ${institutionResults.created}`)
    console.log(`  Skipped: ${institutionResults.skipped}`)
    console.log(`  Errors: ${institutionResults.errors.length}`)
    console.log(`\nPrograms:`)
    console.log(`  Created: ${programResults.created}`)
    console.log(`  Skipped: ${programResults.skipped}`)
    console.log(`  Errors: ${programResults.errors.length}`)

    if (institutionResults.errors.length > 0 || programResults.errors.length > 0) {
      console.log(`\n⚠️  Some errors occurred. Check the output above for details.`)
    }

    console.log(`\n💾 Database restored from: ${csvPath}`)
  } catch (error) {
    console.error("❌ Error restoring from CSV:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

restoreFromMapCSV()

