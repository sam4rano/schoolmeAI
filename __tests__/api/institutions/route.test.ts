import { GET } from "@/app/api/institutions/route"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    institution: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock("@/lib/utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe("GET /api/institutions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return institutions with pagination", async () => {
    const mockInstitutions = [
      {
        id: "inst-1",
        name: "University of Lagos",
        type: "university",
        ownership: "federal",
        state: "Lagos",
        city: "Lagos",
        website: "https://unilag.edu.ng",
        programs: [],
      },
      {
        id: "inst-2",
        name: "University of Ibadan",
        type: "university",
        ownership: "federal",
        state: "Oyo",
        city: "Ibadan",
        website: "https://ui.edu.ng",
        programs: [],
      },
    ]

    ;(prisma.institution.findMany as jest.Mock).mockResolvedValue(mockInstitutions)
    ;(prisma.institution.count as jest.Mock).mockResolvedValue(2)

    const request = new NextRequest("http://localhost:3000/api/institutions?page=1&limit=20")

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(2)
    expect(data.pagination.total).toBe(2)
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(20)
  })

  it("should filter institutions by type", async () => {
    const mockInstitutions = [
      {
        id: "inst-1",
        name: "University of Lagos",
        type: "university",
        ownership: "federal",
        state: "Lagos",
        city: "Lagos",
        programs: [],
      },
    ]

    ;(prisma.institution.findMany as jest.Mock).mockResolvedValue(mockInstitutions)
    ;(prisma.institution.count as jest.Mock).mockResolvedValue(1)

    const request = new NextRequest("http://localhost:3000/api/institutions?type=university")

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(prisma.institution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "university",
        }),
      })
    )
  })

  it("should filter institutions by ownership", async () => {
    const mockInstitutions = [
      {
        id: "inst-1",
        name: "Private University",
        type: "university",
        ownership: "private",
        state: "Lagos",
        city: "Lagos",
        programs: [],
      },
    ]

    ;(prisma.institution.findMany as jest.Mock).mockResolvedValue(mockInstitutions)
    ;(prisma.institution.count as jest.Mock).mockResolvedValue(1)

    const request = new NextRequest("http://localhost:3000/api/institutions?ownership=private")

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(prisma.institution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownership: "private",
        }),
      })
    )
  })

  it("should search institutions by name", async () => {
    const mockInstitutions = [
      {
        id: "inst-1",
        name: "University of Lagos",
        type: "university",
        ownership: "federal",
        state: "Lagos",
        city: "Lagos",
        programs: [],
      },
    ]

    ;(prisma.institution.findMany as jest.Mock).mockResolvedValue(mockInstitutions)
    ;(prisma.institution.count as jest.Mock).mockResolvedValue(1)

    const request = new NextRequest("http://localhost:3000/api/institutions?query=Lagos")

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(prisma.institution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({
            contains: "Lagos",
            mode: "insensitive",
          }),
        }),
      })
    )
  })

  it("should handle pagination correctly", async () => {
    const mockInstitutions = Array.from({ length: 10 }, (_, i) => ({
      id: `inst-${i}`,
      name: `Institution ${i}`,
      type: "university",
      ownership: "federal",
      state: "Lagos",
      city: "Lagos",
      programs: [],
    }))

    ;(prisma.institution.findMany as jest.Mock).mockResolvedValue(mockInstitutions)
    ;(prisma.institution.count as jest.Mock).mockResolvedValue(50)

    const request = new NextRequest("http://localhost:3000/api/institutions?page=2&limit=10")

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination.page).toBe(2)
    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.total).toBe(50)
    expect(data.pagination.totalPages).toBe(5)
  })

  it("should handle database errors", async () => {
    const dbError = new Error("Database connection failed")
    ;(prisma.institution.findMany as jest.Mock).mockRejectedValue(dbError)

    const request = new NextRequest("http://localhost:3000/api/institutions")

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Internal server error")
  })

  it("should handle invalid query parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/institutions?page=invalid")

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid query parameters")
  })
})

