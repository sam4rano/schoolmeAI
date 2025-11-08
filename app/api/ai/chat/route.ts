import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ragPipeline } from "@/lib/ai/rag"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  entityType: z.enum(["institution", "program", "all"]).optional(),
  limit: z.number().min(1).max(10).optional(),
  userContext: z
    .object({
      utme: z.number().optional(),
      olevels: z.record(z.string()).optional(),
      stateOfOrigin: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Get session with proper error handling
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (error) {
      logger.error("Session error in AI chat", error, {
        endpoint: "/api/ai/chat",
        method: "POST",
      })
      return NextResponse.json(
        { error: "Authentication error. Please sign in again." },
        { status: 401 }
      )
    }

    // Allow guest access with limited features
    // Guest users can use the AI assistant but with rate limiting
    const isGuest = !session?.user?.id

    const body = await request.json()
    const validatedData = chatSchema.parse(body)

    // For guest users, limit the number of results and context
    const limit = isGuest ? Math.min(validatedData.limit || 3, 3) : (validatedData.limit || 5)

    const result = await ragPipeline(validatedData.message, {
      entityType: validatedData.entityType === "all" ? undefined : validatedData.entityType,
      limit,
      minSimilarity: 0.3, // Lower threshold to get more results when embeddings are sparse
      userContext: validatedData.userContext
        ? {
            userProfile: validatedData.userContext,
          }
        : undefined,
    })

    return NextResponse.json({
      data: {
        answer: result.answer,
        sources: result.sources,
        context: result.context,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error in AI chat", error, {
      endpoint: "/api/ai/chat",
      method: "POST",
    })
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    // Check for common issues
    if (errorMessage.includes("API_KEY") || errorMessage.includes("not set")) {
      return NextResponse.json(
        { 
          error: "AI service configuration error. Please configure GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.",
          details: errorMessage
        },
        { status: 500 }
      )
    }
    
    if (errorMessage.includes("embeddings") || errorMessage.includes("relation") || errorMessage.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Database configuration error. The embeddings table may not exist. Please run database migrations.",
          details: errorMessage
        },
        { status: 500 }
      )
    }
    
    // Return error with details in development, generic message in production
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === "development" 
          ? `Internal server error: ${errorMessage}` 
          : "Internal server error. Please try again later.",
        ...(process.env.NODE_ENV === "development" && { details: errorMessage })
      },
      { status: 500 }
    )
  }
}

