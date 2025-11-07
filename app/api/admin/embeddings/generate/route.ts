import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAllEmbeddings, generateInstitutionEmbeddings, generateProgramEmbeddings } from "@/lib/ai/generate-embeddings"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { type } = body // "institution", "program", or "all"

    let result
    if (type === "institution") {
      const institutionResult = await generateInstitutionEmbeddings()
      result = { 
        message: "Institution embeddings generated successfully",
        count: institutionResult.count
      }
    } else if (type === "program") {
      const programResult = await generateProgramEmbeddings()
      result = { 
        message: "Program embeddings generated successfully",
        count: programResult.count
      }
    } else {
      const allResult = await generateAllEmbeddings()
      result = { 
        message: "All embeddings generated successfully",
        ...allResult
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating embeddings:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate embeddings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

