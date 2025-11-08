import { logger } from "@/lib/utils/logger"

describe("Logger", () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = process.env
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe("debug", () => {
    it("should log debug messages in development", () => {
      process.env.NODE_ENV = "development"
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation()
      
      logger.debug("Test debug message", { key: "value" })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test debug message")
      )
      
      consoleSpy.mockRestore()
    })

    it("should not log debug messages in production", () => {
      process.env.NODE_ENV = "production"
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation()
      
      logger.debug("Test debug message")
      
      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe("info", () => {
    it("should log info messages", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation()
      
      logger.info("Test info message", { key: "value" })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test info message")
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe("warn", () => {
    it("should log warn messages", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation()
      
      logger.warn("Test warn message", { key: "value" })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test warn message")
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe("error", () => {
    it("should log error messages with Error object", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      const error = new Error("Test error")
      
      logger.error("Test error message", error, { key: "value" })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test error")
      )
      
      consoleSpy.mockRestore()
    })

    it("should log error messages with string", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      
      logger.error("Test error message", "string error", { key: "value" })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("string error")
      )
      
      consoleSpy.mockRestore()
    })

    it("should log error messages without error object", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      
      logger.error("Test error message", undefined, { key: "value" })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]")
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test error message")
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe("formatMessage", () => {
    it("should format messages with timestamp and level", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation()
      
      logger.info("Test message")
      
      const call = consoleSpy.mock.calls[0][0]
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      expect(call).toContain("[INFO]")
      expect(call).toContain("Test message")
      
      consoleSpy.mockRestore()
    })

    it("should include context in formatted message", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation()
      
      logger.info("Test message", { key: "value", number: 123 })
      
      const call = consoleSpy.mock.calls[0][0]
      expect(call).toContain('{"key":"value","number":123}')
      
      consoleSpy.mockRestore()
    })
  })
})

