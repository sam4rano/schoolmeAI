import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"

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
    logger.error("Error fetching courses", error, {
      endpoint: "/api/programs/courses",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

