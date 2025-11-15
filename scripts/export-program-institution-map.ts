import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

// Escape CSV field (handle quotes and commas)
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return ""
  }
  const str = String(field)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

async function exportProgramInstitutionMap() {
  try {
    console.log("Fetching programs with institution data...")

    // Fetch all programs with their institutions
    const programs = await prisma.program.findMany({
      select: {
        id: true,
        name: true,
        faculty: true,
        department: true,
        degreeType: true,
        accreditationStatus: true,
        accreditationMaturityDate: true,
        accreditationLastUpdated: true,
        isActive: true,
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            ownership: true,
            state: true,
            city: true,
            website: true,
            accreditationStatus: true,
          },
        },
        lastVerifiedAt: true,
        dataQualityScore: true,
        provenance: true,
      },
      orderBy: [
        { institution: { name: "asc" } },
        { name: "asc" },
      ],
    })

    console.log(`Found ${programs.length} programs`)

    // Create CSV header
    const headers = [
      "Program ID",
      "Program Name",
      "Faculty",
      "Department",
      "Degree Type",
      "Accreditation Status",
      "Accreditation Maturity Date",
      "Accreditation Last Updated",
      "Is Active",
      "Institution ID",
      "Institution Name",
      "Institution Type",
      "Institution Ownership",
      "State",
      "City",
      "Institution Website",
      "Institution Accreditation Status",
      "Last Verified At",
      "Data Quality Score",
      "Provenance Source",
      "Provenance Fetched At",
      "Provenance License",
    ]

    // Create CSV rows
    const rows: string[] = []
    rows.push(headers.map(escapeCSVField).join(","))

    for (const program of programs) {
      const provenance = program.provenance as any
      const row = [
        program.id,
        program.name,
        program.faculty || "",
        program.department || "",
        program.degreeType || "",
        program.accreditationStatus || "",
        program.accreditationMaturityDate?.toString() || "",
        program.accreditationLastUpdated ? program.accreditationLastUpdated.toISOString() : "",
        program.isActive ? "true" : "false",
        program.institution.id,
        program.institution.name,
        program.institution.type,
        program.institution.ownership,
        program.institution.state,
        program.institution.city,
        program.institution.website || "",
        program.institution.accreditationStatus || "",
        program.lastVerifiedAt ? program.lastVerifiedAt.toISOString() : "",
        program.dataQualityScore?.toString() || "",
        provenance?.source_url || "",
        provenance?.fetched_at || "",
        provenance?.license || "",
      ]

      rows.push(row.map(escapeCSVField).join(","))
    }

    // Write to file
    const outputPath = path.join(process.cwd(), "csv_folder", "map_program.csv")
    const csvContent = rows.join("\n")
    fs.writeFileSync(outputPath, csvContent, "utf-8")

    console.log(`\n✅ Export completed!`)
    console.log(`   File saved to: ${outputPath}`)
    console.log(`   Total programs: ${programs.length}`)
    console.log(`   Total institutions: ${new Set(programs.map(p => p.institution.id)).size}`)

    // Show sample of first few rows
    console.log(`\n📋 Sample (first 5 programs):`)
    const sampleRows = rows.slice(1, 6)
    sampleRows.forEach((row, index) => {
      const fields = row.split(",")
      console.log(`   ${index + 1}. ${fields[1]} (${fields[7]})`)
    })

    console.log(`\n💾 This CSV can be used to restore the database:`)
    console.log(`   - Via script: npx tsx scripts/restore-from-map-csv.ts`)
    console.log(`   - Via admin dashboard: Upload to /admin/restore endpoint`)
  } catch (error) {
    console.error("Error exporting program-institution map:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

exportProgramInstitutionMap()

