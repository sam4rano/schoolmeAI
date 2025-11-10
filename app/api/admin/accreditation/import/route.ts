import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { logAuditEvent } from "@/lib/utils/audit-logger"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { logger } from "@/lib/utils/logger"

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

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

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

    // Validate CSV structure
    const requiredFields = ["University", "Program", "Latest_Status", "Maturity_Date"]
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
      renamed: 0,
      discontinued: 0,
      errors: [] as string[],
      unmatched: [] as any[],
    }

    const currentYear = new Date().getFullYear()
    const updateDate = new Date()

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

    // Get all programs for matching
    const allPrograms = await prisma.program.findMany({
      select: { 
        id: true, 
        name: true, 
        institutionId: true,
      },
    })
    
    // Note: We'll fetch isActive and accreditationLastUpdated when needed
    // to avoid Prisma type issues with select
    
    // Get institution names for programs
    const programInstitutions = await prisma.institution.findMany({
      where: { id: { in: [...new Set(allPrograms.map(p => p.institutionId))] } },
      select: { id: true, name: true },
    })
    
    const institutionNameMap = new Map(programInstitutions.map(inst => [inst.id, inst.name]))

    // Process each CSV row
    for (const row of csvData) {
      try {
        const universityName = row.University?.trim() || ""
        const programName = row.Program?.trim() || ""
        const status = row.Latest_Status?.trim() || ""
        const maturityYear = parseInt(row.Maturity_Date?.trim() || "0", 10)
        const faculty = row.Faculty?.trim() || null

        if (!universityName || !programName) {
          results.errors.push(`Skipping row: missing university or program name`)
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

        // Find program (fuzzy match)
        const normalizedProgName = normalizeName(programName)
        const institutionPrograms = allPrograms.filter((p) => p.institutionId === institutionId)

        let matchedProgram: (typeof allPrograms[0] & { originalName?: string }) | null = null
        let matchType: "exact" | "fuzzy" | null = null

        // Exact match first
        const exactMatch = institutionPrograms.find(
          (p) => normalizeName(p.name) === normalizedProgName
        )
        if (exactMatch) {
          matchedProgram = exactMatch
          matchType = "exact"
        } else {
          // Fuzzy match
          let bestMatch: { program: typeof allPrograms[0]; similarity: number } | null = null
          institutionPrograms.forEach((prog) => {
            const sim = similarity(normalizeName(prog.name), normalizedProgName)
            if (sim > 0.75 && (!bestMatch || sim > bestMatch.similarity)) {
              bestMatch = { program: prog, similarity: sim }
            }
          })
          if (bestMatch !== null) {
            const match = bestMatch as { program: typeof allPrograms[0]; similarity: number }
            matchedProgram = { ...match.program, originalName: match.program.name }
            matchType = "fuzzy"
          }
        }

        // Determine if re-accredited (maturity year >= 2024)
        const isReAccredited = maturityYear >= 2024
        const isExpired = maturityYear < currentYear

        if (matchedProgram) {
          // Update existing program
          const updateData: any = {
            accreditationStatus: status,
            accreditationMaturityDate: maturityYear,
            accreditationLastUpdated: updateDate,
            isActive: true, // If in NUC data, assume still active
            lastVerifiedAt: updateDate,
          }

          // If fuzzy match and similarity is high, consider it a rename
          if (matchType === "fuzzy" && matchedProgram.name !== programName) {
            // Update name if similarity is very high (>0.9)
            const sim = similarity(normalizeName(matchedProgram.name), normalizedProgName)
            if (sim > 0.9) {
              updateData.name = programName
              results.renamed++
            }
          }

          // Update faculty if provided
          if (faculty) {
            updateData.faculty = faculty
          }

          await prisma.program.update({
            where: { id: matchedProgram.id },
            data: updateData,
          })

          results.matched++
          results.updated++
        } else {
          // Program not found - might be new or discontinued
          // Check if institution has similar programs
          const hasSimilarPrograms = institutionPrograms.length > 0

          if (hasSimilarPrograms) {
            // Likely a new program or renamed
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
                missingFields: ["description", "duration", "admissionRequirements"],
                provenance: {
                  source: "NUC Accreditation",
                  fetched_at: updateDate.toISOString(),
                  license: "NUC Official Data",
                },
              } as any, // Type assertion to work around Prisma type issues
            })
            results.created++
          } else {
            // Institution has no programs - might be new
            results.unmatched.push({
              university: universityName,
              program: programName,
              reason: "Program not found and institution has no programs",
            })
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`Error processing ${row.Program}: ${errorMsg}`)
        logger.error("Error processing accreditation row", error, {
          row,
          endpoint: "/api/admin/accreditation/import",
        })
      }
    }

    // Mark programs as discontinued if they're not in the CSV but were previously active
    // Only for institutions that have programs in the CSV
    const csvInstitutionIds = new Set(
      csvData
        .map((row) => {
          const uniName = normalizeName(row.University?.trim() || "")
          for (const [normalized, id] of institutionMap.entries()) {
            if (similarity(normalized, uniName) > 0.8) {
              return id
            }
          }
          return null
        })
        .filter((id): id is string => id !== null)
    )

    for (const instId of csvInstitutionIds) {
      const csvPrograms = csvData
        .filter((row) => {
          const uniName = normalizeName(row.University?.trim() || "")
          for (const [normalized, id] of institutionMap.entries()) {
            if (similarity(normalized, uniName) > 0.8 && id === instId) {
              return true
            }
          }
          return false
        })
        .map((row) => normalizeName(row.Program?.trim() || ""))

      const dbPrograms = allPrograms.filter((p) => p.institutionId === instId)

      for (const dbProg of dbPrograms) {
        // Fetch full program to check isActive and accreditationLastUpdated
        const fullProgram = await prisma.program.findUnique({
          where: { id: dbProg.id },
        })
        
        if (!fullProgram || !(fullProgram as any).isActive) continue
        
        const normalizedDbName = normalizeName(dbProg.name)
        const foundInCSV = csvPrograms.some(
          (csvProg) => similarity(normalizeName(csvProg), normalizedDbName) > 0.75
        )

        if (!foundInCSV) {
          // Program not in CSV - might be discontinued
          // Only mark as inactive if it's been a while since last update
          const lastUpdate = (fullProgram as any).accreditationLastUpdated as Date | null
          if (!lastUpdate || lastUpdate < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
            await prisma.program.update({
              where: { id: dbProg.id },
              data: { isActive: false } as any, // Type assertion to work around Prisma type issues
            })
            results.discontinued++
          }
        }
      }
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      entityType: "program",
      entityId: "bulk-accreditation",
      action: "update",
      metadata: {
        matched: results.matched,
        updated: results.updated,
        created: results.created,
        renamed: results.renamed,
        discontinued: results.discontinued,
        errors: results.errors.length,
        unmatched: results.unmatched.length,
      },
    })

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${csvData.length} records: ${results.matched} matched, ${results.updated} updated, ${results.created} created, ${results.renamed} renamed, ${results.discontinued} discontinued`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

