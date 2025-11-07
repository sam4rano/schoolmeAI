import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        institution: true,
      },
    })

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: program })
  } catch (error) {
    console.error("Error fetching program:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


