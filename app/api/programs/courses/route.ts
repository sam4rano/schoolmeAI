import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get all unique program names (courses)
    const programs = await prisma.program.findMany({
      select: {
        name: true,
      },
      distinct: ["name"],
      orderBy: {
        name: "asc",
      },
    })

    const courses = programs.map((p) => p.name).filter(Boolean)

    return NextResponse.json({
      data: courses,
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

