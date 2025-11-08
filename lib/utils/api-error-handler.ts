import { NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "./logger"

export function handleApiError(error: unknown): NextResponse {
  // Handle unauthorized errors
  if (error instanceof Error && error.message.includes("Unauthorized")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Handle validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid data", details: error.errors },
      { status: 400 }
    )
  }

  // Handle general errors
  logger.error("API Error", error)
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  )
}

