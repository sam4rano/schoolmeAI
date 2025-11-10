import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ragPipeline } from "@/lib/ai/rag"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { AI, HTTP_STATUS } from "@/lib/constants"

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               entityType:
 *                 type: string
 *                 enum: [institution, program, all]
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               userContext:
 *                 type: object
 *                 properties:
 *                   utme:
 *                     type: number
 *                   olevels:
 *                     type: object
 *                   stateOfOrigin:
 *                     type: string
 *     responses:
 *       200:
 *         description: AI response
 *       401:
 *         description: Unauthorized (guest access allowed with limitations)
 *       500:
 *         description: Internal server error
 */
const chatSchema = z.object({
  message: z.string().min(1).max(AI.MAX_MESSAGE_LENGTH),
  entityType: z.enum(["institution", "program", "all"]).optional(),
  limit: z.number().min(1).max(AI.MAX_LIMIT).optional(),
  userContext: z
    .object({
      utme: z.number().optional(),
      olevels: z.record(z.string()).optional(),
      stateOfOrigin: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
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
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Allow guest access with limited features
    // Guest users can use the AI assistant but with rate limiting
    const isGuest = !session?.user?.id

    const body = await request.json()
    const validatedData = chatSchema.parse(body)

    // For guest users, limit the number of results and context
    const limit = isGuest ? Math.min(validatedData.limit || AI.GUEST_LIMIT, AI.GUEST_LIMIT) : (validatedData.limit || AI.DEFAULT_LIMIT)

    const result = await ragPipeline(validatedData.message, {
      entityType: validatedData.entityType === "all" ? undefined : validatedData.entityType,
      limit,
      minSimilarity: AI.MIN_SIMILARITY_THRESHOLD, // Lower threshold to get more results when embeddings are sparse
      userContext: validatedData.userContext
        ? {
            userProfile: validatedData.userContext,
          }
        : undefined,
      conversationHistory: validatedData.conversationHistory,
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
        { status: HTTP_STATUS.BAD_REQUEST }
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
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }
    
    if (errorMessage.includes("embeddings") || errorMessage.includes("relation") || errorMessage.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Database configuration error. The embeddings table may not exist. Please run database migrations.",
          details: errorMessage
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
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

