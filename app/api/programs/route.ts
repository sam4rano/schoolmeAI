import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const searchSchema = z.object({
  query: z.string().optional(),
  institution_id: z.string().optional(),
  institution_type: z.enum(["university", "polytechnic", "college", "nursing", "military"]).optional(),
  degreeType: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = searchSchema.parse(params)

    const { query, institution_id, institution_type, degreeType, page = 1, limit = 20 } = validatedParams

    const where: any = {}
    
    if (institution_id) {
      where.institutionId = institution_id
    }
    
    if (institution_type) {
      where.institution = {
        ...where.institution,
        type: institution_type,
      }
    }
    
    if (degreeType && degreeType !== "all") {
      where.degreeType = degreeType
    }
    
    if (query) {
      // Support searching by institution abbreviation (e.g., "unilag" for "University of Lagos")
      const queryLower = query.toLowerCase()
      const institutionAbbreviations: Record<string, string> = {
        "unilag": "University of Lagos",
        "ui": "University of Ibadan",
        "oau": "Obafemi Awolowo University",
        "unilorin": "University of Ilorin",
        "abu": "Ahmadu Bello University",
        "unn": "University of Nigeria",
        "uniben": "University of Benin",
        "unical": "University of Calabar",
        "uniport": "University of Port Harcourt",
        "lasu": "Lagos State University",
        "buk": "Bayero University Kano",
        "futa": "Federal University of Technology, Akure",
        "fupre": "Federal University of Petroleum Resources",
        "covenant": "Covenant University",
      }
      
      const expandedQuery = institutionAbbreviations[queryLower] || query
      
      where.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          faculty: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          department: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          institution: {
            OR: [
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: expandedQuery,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      ]
    }

    const skip = (page - 1) * limit

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        skip,
        take: limit,
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              type: true,
              ownership: true,
              state: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.program.count({ where }),
    ])

    return NextResponse.json({
      data: programs,
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

    console.error("Error fetching programs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


