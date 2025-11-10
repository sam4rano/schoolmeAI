import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

/**
 * Reconciliation script to:
 * 1. Filter out universities from nursing schools (they're already captured in universities)
 * 2. Use accreditation_results.csv as source of truth for university programs
 * 3. Map programs from CSV to university courses
 * 4. Ensure unique data, no repetition
 * 5. Have clear source of truth for all data
 */

// Fuzzy string matching
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

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Extract university core name (without location/state)
function extractUniversityCore(name: string): string {
  // Remove common location indicators
  let core = name
    .replace(/\b(state|federal|private|university|of|the)\b/g, "")
    .replace(/\b(abuja|lagos|kano|ibadan|benin|calabar|ilorin|jos|maiduguri|port.?harcourt|sokoto|nsukka|zaria|akure|owerri|yola|minna|bauchi|abakaliki|akoka|uzairue|ekpoma|ago.?iwoye|ogbomoso|akungba|uli|lapai|rumuolumeni|wudil|ile.?ife|gwagwalada)\b/g, "")
    .replace(/\b(ekiti|delta|ebonyi|adamawa|yobe|bauchi|lagos|imo|niger|nasarawa|kogi|zamfara|gombe|enugu|benue|kebbi|rivers|edo|oyo|osun|ondo|anambra|abia|akwa.?ibom|bayelsa|borno|cross.?river|kwara|plateau|taraba|sokoto|katsina|jigawa)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
  
  return core
}

async function reconcileInstitutions() {
  try {
    console.log("Starting institution reconciliation...\n")

    // Step 1: Identify and filter out ONLY exact duplicates (same name, same location)
    // NOTE: Nursing schools affiliated with universities are LEGITIMATE and should be kept
    // They are separate institutions that train nurses, even if affiliated with universities
    console.log("Step 1: Identifying exact duplicate nursing schools...")
    console.log("  (Note: Nursing schools affiliated with universities are legitimate and will be kept)\n")
    
    const nursingSchools = await prisma.institution.findMany({
      where: { type: "nursing" },
      select: { id: true, name: true, state: true, city: true, accreditationStatus: true },
    })

    const universities = await prisma.institution.findMany({
      where: { type: "university" },
      select: { id: true, name: true, state: true, city: true },
    })

    // Find ONLY exact duplicates (same name, same location) - not affiliated schools
    const exactDuplicates: Array<{ id: string; name: string; matchedUniversity: string }> = []

    for (const nursingSchool of nursingSchools) {
      const nursingName = normalizeName(nursingSchool.name)
      const nursingState = nursingSchool.state || ""
      const nursingCity = normalizeName(nursingSchool.city || "")

      // Check if it's an EXACT duplicate (same name, same location)
      // NOT a department/faculty of a university (those are legitimate)
      for (const university of universities) {
        const uniName = normalizeName(university.name)
        const uniState = university.state || ""
        const uniCity = normalizeName(university.city || "")

        // Only match if:
        // 1. Names are exactly the same (or very close - >0.98 similarity)
        // 2. Same state and city
        // 3. NOT a department/faculty (doesn't contain "department", "faculty", "college of nursing")
        const nameSim = similarity(nursingName, uniName)
        const isDepartment = /department|faculty|college of nursing|school of nursing/i.test(nursingSchool.name)
        
        if (
          nameSim > 0.98 && // Very high similarity (almost exact match)
          !isDepartment && // Not a department/faculty
          nursingState === uniState && // Same state
          (nursingCity === uniCity || nursingCity === "" || uniCity === "") // Same city or one is missing
        ) {
          exactDuplicates.push({
            id: nursingSchool.id,
            name: nursingSchool.name,
            matchedUniversity: university.name,
          })
          break // Found exact match, no need to check others
        }
      }
    }

    console.log(`Found ${exactDuplicates.length} exact duplicate nursing schools (same name, same location)`)

    // Step 2: Delete ONLY exact duplicates
    console.log("\nStep 2: Removing exact duplicate nursing schools...")
    console.log("  (Only deleting exact duplicates - affiliated schools are kept)\n")
    
    let deleted = 0
    
    for (const duplicate of exactDuplicates) {
      // Verify the matched university actually exists
      const matchedUni = await prisma.institution.findFirst({
        where: {
          name: {
            equals: duplicate.matchedUniversity,
            mode: "insensitive",
          },
          type: "university",
        },
      })
      
      if (matchedUni) {
        await prisma.institution.delete({
          where: { id: duplicate.id },
        })
        deleted++
        console.log(`  ✅ Deleted: ${duplicate.name} (exact duplicate of ${duplicate.matchedUniversity})`)
      }
    }
    console.log(`\nDeleted ${deleted} exact duplicate nursing schools`)
    console.log(`All other nursing schools (including university-affiliated ones) are kept as legitimate institutions\n`)

    // Step 3: Use accreditation_results.csv as source of truth for university programs
    console.log("Step 3: Mapping programs from accreditation CSV to universities...")
    const csvPath = path.join(
      process.cwd(),
      "..",
      "practice_project",
      "accreditation_results.csv"
    )

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found: ${csvPath}`)
      return
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const records = parseCSV(csvContent)

    console.log(`Found ${records.length} program records in CSV`)

    // Group programs by university
    const programsByUniversity = new Map<string, Array<{
      program: string
      faculty: string
      status: string
      maturityDate: number
    }>>()

    for (const record of records) {
      const universityName = record.University?.trim()
      const programName = record.Program?.trim()
      const status = record.Latest_Status?.trim()
      const maturityDate = parseInt(record.Maturity_Date?.trim() || "0", 10)

      if (!universityName || !programName) continue

      if (!programsByUniversity.has(universityName)) {
        programsByUniversity.set(universityName, [])
      }

      programsByUniversity.get(universityName)!.push({
        program: programName,
        faculty: record.Faculty?.trim() || "",
        status: status || "Unknown",
        maturityDate: maturityDate || 0,
      })
    }

    console.log(`Found ${programsByUniversity.size} unique universities in CSV`)

    // Step 4: Update university programs from CSV (source of truth)
    console.log("\nStep 4: Updating university programs from accreditation CSV...")
    let programsUpdated = 0
    let programsCreated = 0
    const currentYear = new Date().getFullYear()

    for (const [universityName, programs] of programsByUniversity.entries()) {
      // Find university in database
      const normalizedUniName = normalizeName(universityName)
      const university = await prisma.institution.findFirst({
        where: {
          type: "university",
          name: {
            contains: universityName,
            mode: "insensitive",
          },
        },
      })

      if (!university) {
        // Try fuzzy match
        const allUniversities = await prisma.institution.findMany({
          where: { type: "university" },
          select: { id: true, name: true },
        })

        let bestMatch: { id: string; name: string; similarity: number } | null = null
        for (const uni of allUniversities) {
          const sim = similarity(normalizedUniName, normalizeName(uni.name))
          if (sim > 0.8 && (!bestMatch || sim > bestMatch.similarity)) {
            bestMatch = { id: uni.id, name: uni.name, similarity: sim }
          }
        }

        if (!bestMatch) {
          console.log(`  ⚠️  University not found: ${universityName}`)
          continue
        }

        // Use matched university
        const matchedUni = await prisma.institution.findUnique({
          where: { id: bestMatch.id },
        })
        if (!matchedUni) continue

        // Update programs for this university
        let uniProgramsCreated = 0
        let uniProgramsUpdated = 0
        
        for (const prog of programs) {
          const existing = await prisma.program.findFirst({
            where: {
              institutionId: matchedUni.id,
              name: {
                equals: prog.program,
                mode: "insensitive",
              },
            },
          })

          if (existing) {
            await prisma.program.update({
              where: { id: existing.id },
              data: {
                accreditationStatus: prog.status,
                accreditationMaturityDate: prog.maturityDate || null,
                accreditationLastUpdated: new Date(),
                isActive: true,
                faculty: prog.faculty || existing.faculty,
              },
            })
            uniProgramsUpdated++
            programsUpdated++
          } else {
            await prisma.program.create({
              data: {
                institutionId: matchedUni.id,
                name: prog.program,
                faculty: prog.faculty || null,
                accreditationStatus: prog.status,
                accreditationMaturityDate: prog.maturityDate || null,
                accreditationLastUpdated: new Date(),
                isActive: true,
                utmeSubjects: [],
                olevelSubjects: [],
                careerProspects: [],
                missingFields: [],
              },
            })
            uniProgramsCreated++
            programsCreated++
          }
        }

        console.log(
          `  ✅ ${matchedUni.name}: ${programs.length} programs (${uniProgramsCreated} created, ${uniProgramsUpdated} updated)`
        )
      } else {
        // Update programs for this university
        let uniProgramsCreated = 0
        let uniProgramsUpdated = 0
        
        for (const prog of programs) {
          const existing = await prisma.program.findFirst({
            where: {
              institutionId: university.id,
              name: {
                equals: prog.program,
                mode: "insensitive",
              },
            },
          })

          if (existing) {
            await prisma.program.update({
              where: { id: existing.id },
              data: {
                accreditationStatus: prog.status,
                accreditationMaturityDate: prog.maturityDate || null,
                accreditationLastUpdated: new Date(),
                isActive: true,
                faculty: prog.faculty || existing.faculty,
              },
            })
            uniProgramsUpdated++
            programsUpdated++
          } else {
            await prisma.program.create({
              data: {
                institutionId: university.id,
                name: prog.program,
                faculty: prog.faculty || null,
                accreditationStatus: prog.status,
                accreditationMaturityDate: prog.maturityDate || null,
                accreditationLastUpdated: new Date(),
                isActive: true,
                utmeSubjects: [],
                olevelSubjects: [],
                careerProspects: [],
                missingFields: [],
              },
            })
            uniProgramsCreated++
            programsCreated++
          }
        }

        console.log(
          `  ✅ ${university.name}: ${programs.length} programs (${uniProgramsCreated} created, ${uniProgramsUpdated} updated)`
        )
      }
    }

    // Step 5: Summary
    console.log("\n✅ Reconciliation completed!")
    console.log(`\nSummary:`)
    console.log(`  - Deleted ${deleted} duplicate nursing schools (universities)`)
    console.log(`  - Updated ${programsUpdated} existing programs`)
    console.log(`  - Created ${programsCreated} new programs`)
    console.log(`  - Total universities processed: ${programsByUniversity.size}`)

    // Final counts
    const finalNursing = await prisma.institution.count({
      where: { type: "nursing" },
    })
    const finalUniversities = await prisma.institution.count({
      where: { type: "university" },
    })
    const finalPrograms = await prisma.program.count({
      where: { institution: { type: "university" } },
    })

    console.log(`\nFinal counts:`)
    console.log(`  - Nursing Schools: ${finalNursing}`)
    console.log(`  - Universities: ${finalUniversities}`)
    console.log(`  - University Programs: ${finalPrograms}`)
  } catch (error) {
    console.error("Error during reconciliation:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

reconcileInstitutions()

