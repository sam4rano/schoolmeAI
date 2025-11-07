import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const searchSchema = z.object({
  query: z.string().optional(),
  course: z.string().optional(), // Exact course name filter
  institution_id: z.string().optional(),
  institution_type: z.enum(["university", "polytechnic", "college", "nursing", "military"]).optional(),
  degreeType: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  rankByDifficulty: z.string().optional().transform((val) => val === "true"), // Rank institutions by difficulty
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = searchSchema.parse(params)

    const { query, course, institution_id, institution_type, degreeType, page = 1, limit = 20, rankByDifficulty } = validatedParams

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
    
    // Filter by exact course name (for course dropdown)
    // If course is selected, don't apply query filter (they're mutually exclusive)
    if (course) {
      where.name = {
        equals: course,
        mode: "insensitive",
      }
    } else if (query) {
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

    // If ranking by difficulty, fetch all programs first, then paginate after ranking
    const shouldRank = rankByDifficulty && course
    const skip = shouldRank ? 0 : (page - 1) * limit
    const take = shouldRank ? undefined : limit

    const [programsRaw, total] = await Promise.all([
      prisma.program.findMany({
        where,
        skip,
        take,
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

    // Calculate institution difficulty scores and rank if requested
    let programs = programsRaw
    if (shouldRank) {
      // Group programs by institution and calculate average cutoff
      const institutionScores = new Map<string, { institution: any; programs: any[]; avgCutoff: number; difficulty: string }>()
      
      programsRaw.forEach((program) => {
        const cutoffHistory = Array.isArray(program.cutoffHistory)
          ? program.cutoffHistory
          : program.cutoffHistory
          ? JSON.parse(JSON.stringify(program.cutoffHistory))
          : []
        
        // Calculate average cutoff from history
        let avgCutoff = 0
        if (cutoffHistory.length > 0) {
          const cutoffs = cutoffHistory
            .map((entry: any) => {
              const cutoff = typeof entry === "object" ? entry.cutoff : entry
              return typeof cutoff === "number" ? cutoff : parseFloat(cutoff) || 0
            })
            .filter((c: number) => c > 0)
          
          if (cutoffs.length > 0) {
            avgCutoff = cutoffs.reduce((sum: number, c: number) => sum + c, 0) / cutoffs.length
          }
        }
        
        // If no cutoff data, use a default based on institution type/ownership
        if (avgCutoff === 0) {
          // Federal universities are generally more competitive
          if (program.institution.type === "university" && program.institution.ownership === "federal") {
            avgCutoff = 200 // Default for competitive federal universities
          } else if (program.institution.type === "university" && program.institution.ownership === "state") {
            avgCutoff = 180 // Default for state universities
          } else {
            avgCutoff = 160 // Default for others
          }
        }
        
        const instId = program.institution.id
        if (!institutionScores.has(instId)) {
          institutionScores.set(instId, {
            institution: program.institution,
            programs: [],
            avgCutoff: 0,
            difficulty: "moderate",
          })
        }
        
        const entry = institutionScores.get(instId)!
        entry.programs.push(program)
        entry.avgCutoff = Math.max(entry.avgCutoff, avgCutoff) // Use highest cutoff
      })
      
      // Determine difficulty level
      const allCutoffs = Array.from(institutionScores.values()).map((e) => e.avgCutoff)
      const maxCutoff = Math.max(...allCutoffs, 0)
      const minCutoff = Math.min(...allCutoffs, 0)
      const range = maxCutoff - minCutoff || 1
      
      institutionScores.forEach((entry) => {
        const percentile = ((entry.avgCutoff - minCutoff) / range) * 100
        if (percentile >= 75) {
          entry.difficulty = "very_competitive"
        } else if (percentile >= 50) {
          entry.difficulty = "competitive"
        } else if (percentile >= 25) {
          entry.difficulty = "moderate"
        } else {
          entry.difficulty = "less_competitive"
        }
      })
      
      // Sort institutions by difficulty (highest cutoff first = most competitive)
      const sortedInstitutions = Array.from(institutionScores.values()).sort(
        (a, b) => b.avgCutoff - a.avgCutoff
      )
      
      // Flatten programs back, maintaining institution order
      programs = sortedInstitutions.flatMap((entry) => entry.programs)
      
      // Add difficulty metadata to each program
      programs = programs.map((program) => {
        const entry = institutionScores.get(program.institution.id)
        return {
          ...program,
          institutionDifficulty: entry?.difficulty,
          institutionAvgCutoff: entry?.avgCutoff,
        }
      })
      
      // Apply pagination after ranking
      const startIndex = (page - 1) * limit
      programs = programs.slice(startIndex, startIndex + limit)
    }

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


