import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType") as "institution" | "program"
    const format = searchParams.get("format") as "json" | "csv"

    if (!entityType || !format) {
      return NextResponse.json(
        { error: "entityType and format are required" },
        { status: 400 }
      )
    }

    if (entityType === "institution") {
      const institutions = await prisma.institution.findMany({
        include: {
          _count: {
            select: {
              programs: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })

      if (format === "json") {
        return NextResponse.json(
          { data: institutions },
          {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename="institutions.json"`,
            },
          }
        )
      } else if (format === "csv") {
        const csv = [
          ["id", "name", "type", "ownership", "state", "city", "website", "programs_count"].join(","),
          ...institutions.map((inst) =>
            [
              inst.id,
              inst.name,
              inst.type,
              inst.ownership,
              inst.state,
              inst.city,
              inst.website || "",
              inst._count.programs,
            ].join(",")
          ),
        ].join("\n")

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="institutions.csv"`,
          },
        })
      }
    } else if (entityType === "program") {
      const programs = await prisma.program.findMany({
        include: {
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })

      if (format === "json") {
        return NextResponse.json(
          { data: programs },
          {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename="programs.json"`,
            },
          }
        )
      } else if (format === "csv") {
        const csv = [
          ["id", "name", "institution_id", "institution_name", "degree_type", "faculty", "department"].join(","),
          ...programs.map((prog) =>
            [
              prog.id,
              prog.name,
              prog.institutionId,
              prog.institution.name,
              prog.degreeType || "",
              prog.faculty || "",
              prog.department || "",
            ].join(",")
          ),
        ].join("\n")

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="programs.csv"`,
          },
        })
      }
    }

    return NextResponse.json(
      { error: "Invalid entity type or format" },
      { status: 400 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

