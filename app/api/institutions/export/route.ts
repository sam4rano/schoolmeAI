import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as fs from "fs"
import * as path from "path"

export async function GET(request: NextRequest) {
  try {
    // Check if CSV file exists
    const csvFolder = path.join(process.cwd(), "csv_folder")
    const csvPath = path.join(csvFolder, "all_institutions.csv")

    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, "utf-8")
      
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="all_institutions.csv"',
        },
      })
    }

    // If file doesn't exist, generate it from database
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

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="all_institutions.csv"',
      },
    })
  } catch (error) {
    console.error("Error exporting institutions:", error)
    return NextResponse.json(
      { error: "Failed to export institutions" },
      { status: 500 }
    )
  }
}

