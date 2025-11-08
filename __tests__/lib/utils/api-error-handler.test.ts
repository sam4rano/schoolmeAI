import { handleApiError } from "@/lib/utils/api-error-handler"
import { NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"

// Mock logger
jest.mock("@/lib/utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe("handleApiError", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should handle unauthorized errors", () => {
    const error = new Error("Unauthorized access")
    const result = handleApiError(error)

    expect(result).toBeInstanceOf(NextResponse)
    expect(result.status).toBe(401)
  })

  it("should handle Zod validation errors", () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    })

    try {
      schema.parse({ email: "invalid", age: 15 })
    } catch (error) {
      const result = handleApiError(error)

      expect(result).toBeInstanceOf(NextResponse)
      expect(result.status).toBe(400)
    }
  })

  it("should handle general errors", () => {
    const error = new Error("General error")
    const result = handleApiError(error)

    expect(result).toBeInstanceOf(NextResponse)
    expect(result.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith("API Error", error)
  })

  it("should handle non-Error objects", () => {
    const error = "String error"
    const result = handleApiError(error)

    expect(result).toBeInstanceOf(NextResponse)
    expect(result.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith("API Error", error)
  })

  it("should handle null/undefined errors", () => {
    const result = handleApiError(null)

    expect(result).toBeInstanceOf(NextResponse)
    expect(result.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith("API Error", null)
  })
})

