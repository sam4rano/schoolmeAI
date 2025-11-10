import { NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "./logger"
import { HTTP_STATUS } from "@/lib/constants"

export function handleApiError(error: unknown): NextResponse {
  // Handle unauthorized errors
  if (error instanceof Error && error.message.includes("Unauthorized")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: HTTP_STATUS.UNAUTHORIZED }
    )
  }

  // Handle validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid data", details: error.errors },
      { status: HTTP_STATUS.BAD_REQUEST }
    )
  }

  // Handle general errors
  logger.error("API Error", error)
  return NextResponse.json(
    { error: "Internal server error" },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  )
}

