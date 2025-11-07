import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ragPipeline } from "@/lib/ai/rag"
import { z } from "zod"

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
      console.error("Session error:", error)
      return NextResponse.json(
        { error: "Authentication error. Please sign in again." },
        { status: 401 }
      )
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to use the AI assistant." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = chatSchema.parse(body)

    const result = await ragPipeline(validatedData.message, {
      entityType: validatedData.entityType === "all" ? undefined : validatedData.entityType,
      limit: validatedData.limit || 5,
      minSimilarity: 0.5,
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

    console.error("Error in AI chat:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

