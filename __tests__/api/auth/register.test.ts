import { POST } from "@/app/api/auth/register/route"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  default: {
    hash: jest.fn(),
  },
}))

jest.mock("@/lib/utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should register a new user successfully", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      roles: [],
      createdAt: new Date(),
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password")

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe("User created successfully")
    expect(data.user.email).toBe("test@example.com")
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    })
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10)
    expect(prisma.user.create).toHaveBeenCalled()
  })

  it("should return 400 if user already exists", async () => {
    const existingUser = {
      id: "user-123",
      email: "test@example.com",
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("User with this email already exists")
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("should return 400 for invalid email", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "invalid-email",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid request data")
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("should return 400 for short password", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "short",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid request data")
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("should handle database errors", async () => {
    const dbError = new Error("Database connection failed")
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(dbError)

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Internal server error")
  })
})

