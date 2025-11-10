import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"
import * as readline from "readline"

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

// Fuzzy string matching using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  const len1 = str1.length
  const len2 = str2.length

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        )
      }
    }
  }

  return matrix[len1][len2]
}

function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - distance / maxLen
}

async function importProgramsFromAccreditation() {
  try {
    console.log("Reading accreditation_results.csv...")
    
    const csvPath = path.join(process.cwd(), "..", "practice_project", "accreditation_results.csv")
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const csvData = parseCSV(csvContent)

    console.log(`Found ${csvData.length} program records in CSV`)

    // Get all institutions for matching
    const institutions = await prisma.institution.findMany({
      select: { id: true, name: true },
    })

    // Create institution name mapping (normalized)
    const institutionMap = new Map<string, string>()
    institutions.forEach((inst) => {
      const normalized = normalizeName(inst.name)
      institutionMap.set(normalized, inst.id)
    })

    const results = {
      matched: 0,
      updated: 0,
      created: 0,
      errors: [] as string[],
      unmatched: [] as any[],
    }

    const currentYear = new Date().getFullYear()
    const updateDate = new Date()

    console.log("\nProcessing programs...")

    // Process each CSV row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      if (i % 100 === 0) {
        console.log(`Processing ${i + 1}/${csvData.length}...`)
      }

      try {
        const universityName = row.University?.trim() || ""
        const programName = row.Program?.trim() || ""
        const status = row.Latest_Status?.trim() || ""
        const maturityYear = parseInt(row.Maturity_Date?.trim() || "0", 10)
        const faculty = row.Faculty?.trim() || null

        if (!universityName || !programName) {
          results.errors.push(`Skipping row ${i + 1}: missing university or program name`)
          continue
        }

        // Find institution (fuzzy match)
        let institutionId: string | null = null
        const normalizedUniName = normalizeName(universityName)
        
        // Exact match first
        if (institutionMap.has(normalizedUniName)) {
          institutionId = institutionMap.get(normalizedUniName)!
        } else {
          // Fuzzy match
          let bestMatch: { id: string; similarity: number } | null = null
          institutions.forEach((inst) => {
            const sim = similarity(normalizeName(inst.name), normalizedUniName)
            if (sim > 0.8 && (!bestMatch || sim > bestMatch.similarity)) {
              bestMatch = { id: inst.id, similarity: sim }
            }
          })
          if (bestMatch !== null) {
            institutionId = (bestMatch as { id: string; similarity: number }).id
          }
        }

        if (!institutionId) {
          results.unmatched.push({
            university: universityName,
            program: programName,
            reason: "Institution not found",
          })
          continue
        }

        // Find or create program
        const normalizedProgName = normalizeName(programName)
        const existing = await prisma.program.findFirst({
          where: {
            name: {
              equals: programName,
              mode: "insensitive",
            },
            institutionId: institutionId,
          },
        })

        // Determine if re-accredited (maturity year >= 2024)
        const isReAccredited = maturityYear >= 2024
        const isExpired = maturityYear < currentYear

        const provenance = {
          source_url: "https://ncce.gov.ng/AccreditedColleges",
          fetched_at: updateDate.toISOString(),
          license: "NUC Official Data",
        }

        if (existing) {
          // Update existing program
          await prisma.program.update({
            where: { id: existing.id },
            data: {
              accreditationStatus: status,
              accreditationMaturityDate: maturityYear,
              accreditationLastUpdated: updateDate,
              isActive: true,
              faculty: faculty || existing.faculty,
              lastVerifiedAt: updateDate,
              provenance: {
                ...(existing.provenance as any),
                ...provenance,
              },
            },
          })
          results.matched++
          results.updated++
        } else {
          // Create new program
          await prisma.program.create({
            data: {
              institutionId: institutionId,
              name: programName,
              faculty: faculty,
              accreditationStatus: status,
              accreditationMaturityDate: maturityYear,
              accreditationLastUpdated: updateDate,
              isActive: true,
              lastVerifiedAt: updateDate,
              dataQualityScore: 70,
              utmeSubjects: [],
              olevelSubjects: [],
              careerProspects: [],
              missingFields: ["description", "duration", "admissionRequirements", "cutoffHistory"],
              provenance: provenance,
            },
          })
          results.created++
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`Row ${i + 1}: ${errorMsg}`)
        if (results.errors.length <= 10) {
          console.error(`Error processing row ${i + 1}:`, errorMsg)
        }
      }
    }

    console.log("\n✅ Import completed!")
    console.log(`\nResults:`)
    console.log(`  Matched: ${results.matched}`)
    console.log(`  Updated: ${results.updated}`)
    console.log(`  Created: ${results.created}`)
    console.log(`  Errors: ${results.errors.length}`)
    console.log(`  Unmatched: ${results.unmatched.length}`)

    if (results.unmatched.length > 0 && results.unmatched.length <= 20) {
      console.log(`\nUnmatched programs:`)
      results.unmatched.forEach((item) => {
        console.log(`  - ${item.university}: ${item.program} (${item.reason})`)
      })
    }

    if (results.errors.length > 0 && results.errors.length <= 10) {
      console.log(`\nErrors:`)
      results.errors.forEach((error) => {
        console.log(`  - ${error}`)
      })
    }
  } catch (error) {
    console.error("Error importing programs:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importProgramsFromAccreditation()

