import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(["university", "polytechnic", "college", "nursing", "military"]).optional(),
  ownership: z.enum(["federal", "state", "private"]).optional(),
  state: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = searchSchema.parse(params)

    const { query, type, ownership, state, page = 1, limit = 20 } = validatedParams

    const where: any = {}
    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive",
      }
    }
    if (type) where.type = type
    if (ownership) where.ownership = ownership
    if (state) where.state = state

    const skip = (page - 1) * limit

    const [institutionsRaw, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip,
        take: limit * 2, // Fetch extra to account for potential duplicates
        include: {
          programs: {
            take: 5, // Limit programs per institution
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.institution.count({ where }),
    ])

    // Deduplicate by ID (in case of database duplicates)
    const seenIds = new Set<string>()
    const institutions = institutionsRaw.filter((inst) => {
      if (seenIds.has(inst.id)) {
        return false
      }
      seenIds.add(inst.id)
      return true
    }).slice(0, limit) // Take only the requested limit

    return NextResponse.json({
      data: institutions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error fetching institutions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

