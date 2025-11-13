import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"

    const programs = await prisma.program.findMany({
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            ownership: true,
            state: true,
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
        "institution",
        "institution_type",
        "faculty",
        "department",
        "degree_type",
        "utme_subjects",
      ]
      const rows = programs.map((program) => [
        program.id,
        program.name,
        program.institution.name,
        program.institution.type,
        program.faculty || "",
        program.department || "",
        program.degreeType || "",
        program.utmeSubjects.join("; "),
      ])

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="programs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Default: JSON
    return NextResponse.json(
      {
        data: programs,
        metadata: {
          total: programs.length,
          exportedAt: new Date().toISOString(),
          format: "json",
        },
      },
      {
        headers: {
          "Content-Disposition": `attachment; filename="programs-${new Date().toISOString().split("T")[0]}.json"`,
        },
      }
    )
  } catch (error) {
    logger.error("Error exporting programs", error, {
      endpoint: "/api/export/programs",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


