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

async function findMissingInstitutions() {
  try {
    console.log("Reading accreditation_results.csv...")
    
    const csvPath = path.join(process.cwd(), "csv_folder", "accreditation_results.csv")
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const csvData = parseCSV(csvContent)

    console.log(`Found ${csvData.length} program records in CSV`)

    // Get all unique universities from CSV
    const csvUniversities = new Set<string>()
    csvData.forEach((row) => {
      const uniName = row.University?.trim()
      if (uniName) {
        csvUniversities.add(uniName)
      }
    })

    console.log(`Found ${csvUniversities.size} unique universities in CSV`)

    // Get all institutions from database
    const dbInstitutions = await prisma.institution.findMany({
      select: { id: true, name: true },
    })

    // Create normalized name map for database institutions
    const dbInstitutionMap = new Map<string, string>()
    dbInstitutions.forEach((inst) => {
      const normalized = normalizeName(inst.name)
      dbInstitutionMap.set(normalized, inst.name)
    })

    console.log(`Found ${dbInstitutions.length} institutions in database`)

    // Find missing institutions
    const missingInstitutions: string[] = []
    const matchedInstitutions: string[] = []

    csvUniversities.forEach((csvUni) => {
      const normalized = normalizeName(csvUni)
      if (!dbInstitutionMap.has(normalized)) {
        missingInstitutions.push(csvUni)
      } else {
        matchedInstitutions.push(csvUni)
      }
    })

    console.log(`\n✅ Analysis complete!`)
    console.log(`\nMatched: ${matchedInstitutions.length}`)
    console.log(`Missing: ${missingInstitutions.length}`)

    if (missingInstitutions.length > 0) {
      console.log(`\n📋 Missing institutions (${missingInstitutions.length}):`)
      missingInstitutions.sort().forEach((uni, index) => {
        console.log(`  ${index + 1}. ${uni}`)
      })

      // Write missing institutions to a file for easy import
      const outputPath = path.join(process.cwd(), "csv_folder", "missing_institutions.csv")
      const csvHeader = "name,type,state,city,website\n"
      const csvRows = missingInstitutions
        .sort()
        .map((name) => {
          // Try to infer type from name
          let type = "University"
          if (name.toLowerCase().includes("polytechnic")) {
            type = "Polytechnic"
          } else if (name.toLowerCase().includes("college")) {
            type = "College"
          } else if (name.toLowerCase().includes("university")) {
            type = "University"
          }
          return `"${name}","${type}","Unknown","Unknown",""`
        })
        .join("\n")

      fs.writeFileSync(outputPath, csvHeader + csvRows, "utf-8")
      console.log(`\n💾 Missing institutions saved to: ${outputPath}`)
      console.log(`   You can edit this file to add state, city, and website information`)
      console.log(`   Then import it using: npx tsx scripts/import-institutions-from-csv.ts`)
    }

    // Also create a script to auto-add them
    if (missingInstitutions.length > 0) {
      console.log(`\n🚀 To auto-add missing institutions (with minimal data), run:`)
      console.log(`   npx tsx scripts/add-missing-institutions.ts`)
    }
  } catch (error) {
    console.error("Error finding missing institutions:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

findMissingInstitutions()

