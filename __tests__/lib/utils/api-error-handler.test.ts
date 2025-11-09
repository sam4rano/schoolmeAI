import { handleApiError } from "@/lib/utils/api-error-handler"
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

  it("should handle unauthorized errors", async () => {
    const error = new Error("Unauthorized access")
    const result = handleApiError(error)

    expect(result).toBeDefined()
    const json = await result.json()
    expect(json.error).toBe("Unauthorized")
    expect(result.status).toBe(401)
  })

  it("should handle Zod validation errors", async () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    })

    try {
      schema.parse({ email: "invalid", age: 15 })
    } catch (error) {
      const result = handleApiError(error)

      expect(result).toBeDefined()
      const json = await result.json()
      expect(json.error).toBe("Invalid data")
      expect(result.status).toBe(400)
    }
  })

  it("should handle general errors", async () => {
    const error = new Error("General error")
    const result = handleApiError(error)

    expect(result).toBeDefined()
    const json = await result.json()
    expect(json.error).toBe("Internal server error")
    expect(result.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith("API Error", error)
  })

  it("should handle non-Error objects", async () => {
    const error = "String error"
    const result = handleApiError(error)

    expect(result).toBeDefined()
    const json = await result.json()
    expect(json.error).toBe("Internal server error")
    expect(result.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith("API Error", error)
  })

  it("should handle null/undefined errors", async () => {
    const result = handleApiError(null)

    expect(result).toBeDefined()
    const json = await result.json()
    expect(json.error).toBe("Internal server error")
    expect(result.status).toBe(500)
    expect(logger.error).toHaveBeenCalledWith("API Error", null)
  })
})

