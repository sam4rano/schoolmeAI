import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

async function exportInstitutionsToCSV() {
  try {
    console.log("Fetching all institutions from database...")
    
    const institutions = await prisma.institution.findMany({
      orderBy: [
        { type: "asc" },
        { name: "asc" },
      ],
      select: {
        name: true,
        type: true,
        ownership: true,
        state: true,
        city: true,
        website: true,
        accreditationStatus: true,
        contact: true,
        provenance: true,
      },
    })

    console.log(`Found ${institutions.length} institutions`)

    // Prepare CSV data
    const headers = [
      "Name",
      "Type",
      "Ownership",
      "State",
      "City",
      "Website",
      "Accreditation Status",
      "Email",
      "Phone",
      "Address",
      "Source URL",
      "License",
    ]

    const rows = institutions.map((inst) => {
      const contact = inst.contact as any || {}
      const provenance = inst.provenance as any || {}
      
      return [
        inst.name || "",
        inst.type || "",
        inst.ownership || "",
        inst.state || "",
        inst.city || "",
        inst.website || "",
        inst.accreditationStatus || "",
        contact.email || "",
        contact.phone || "",
        contact.address || "",
        provenance.source_url || "",
        provenance.license || "",
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape commas and quotes in CSV cells
          const cellStr = String(cell || "")
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(",")
      ),
    ].join("\n")

    // Write to file
    const csvFolder = path.join(process.cwd(), "csv_folder")
    const csvPath = path.join(csvFolder, "all_institutions.csv")
    
    // Ensure directory exists
    if (!fs.existsSync(csvFolder)) {
      fs.mkdirSync(csvFolder, { recursive: true })
    }

    fs.writeFileSync(csvPath, csvContent, "utf-8")
    
    console.log(`✅ Exported ${institutions.length} institutions to ${csvPath}`)
    console.log(`\nBreakdown by type:`)
    
    const byType = institutions.reduce((acc, inst) => {
      acc[inst.type] = (acc[inst.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
  } catch (error) {
    console.error("Error exporting institutions:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

exportInstitutionsToCSV()

