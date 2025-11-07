import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"

    const institutions = await prisma.institution.findMany({
      include: {
        programs: {
          select: {
            id: true,
            name: true,
            degreeType: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    if (format === "csv") {
      // Convert to CSV
      const headers = [
        "id",
        "name",
        "type",
        "ownership",
        "state",
        "city",
        "website",
        "accreditationStatus",
      ]
      const rows = institutions.map((inst) => [
        inst.id,
        inst.name,
        inst.type,
        inst.ownership,
        inst.state,
        inst.city,
        inst.website || "",
        inst.accreditationStatus || "",
      ])

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="institutions-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Default: JSON
    return NextResponse.json(
      {
        data: institutions,
        metadata: {
          total: institutions.length,
          exportedAt: new Date().toISOString(),
          format: "json",
        },
      },
      {
        headers: {
          "Content-Disposition": `attachment; filename="institutions-${new Date().toISOString().split("T")[0]}.json"`,
        },
      }
    )
  } catch (error) {
    console.error("Error exporting institutions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


