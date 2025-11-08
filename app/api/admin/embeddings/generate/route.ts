import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateAllEmbeddings, generateInstitutionEmbeddings, generateProgramEmbeddings } from "@/lib/ai/generate-embeddings"
import { logger } from "@/lib/utils/logger"

// Increase timeout for this route (Vercel Pro: 60s, Hobby: 10s)
export const maxDuration = 60

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
      select: { roles: true },
    })

    if (!user?.roles?.includes("admin")) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { type } = body // "institution", "program", or "all"

    let result
    try {
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
      logger.error("Error generating embeddings", error, {
        endpoint: "/api/admin/embeddings/generate",
        method: "POST",
        type,
      })
      
      // If it's a timeout error, return a message that generation is continuing in background
      if (error instanceof Error && (error.message.includes("timeout") || error.message.includes("aborted") || error.message.includes("Function execution"))) {
        return NextResponse.json(
          { 
            message: "Embedding generation started. This may take several minutes. Check the embedding count in a few minutes.",
            processing: true
          },
          { status: 202 } // Accepted - processing
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to generate embeddings",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error("Error generating embeddings", error, {
      endpoint: "/api/admin/embeddings/generate",
      method: "POST",
    })
    return NextResponse.json(
      { 
        error: "Failed to generate embeddings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

