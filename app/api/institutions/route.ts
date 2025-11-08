import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"

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
        select: {
          id: true,
          name: true,
          type: true,
          ownership: true,
          state: true,
          city: true,
          website: true,
          contact: true,
          accreditationStatus: true,
          courses: true,
          feesSchedule: true, // Use feesSchedule instead of tuitionFees if it exists
          provenance: true,
          lastVerifiedAt: true,
          dataQualityScore: true,
          missingFields: true,
          createdAt: true,
          updatedAt: true,
          programs: {
            take: 5, // Limit programs per institution
            select: {
              id: true,
              name: true,
              faculty: true,
              department: true,
              degreeType: true,
              description: true,
              duration: true,
              utmeSubjects: true,
              olevelSubjects: true,
              admissionRequirements: true,
              cutoffHistory: true,
              tuitionFees: true,
              careerProspects: true,
              courseCurriculum: true,
              applicationDeadline: true,
              officialUrl: true,
              contact: true,
              accreditationStatus: true,
              lastVerifiedAt: true,
              dataQualityScore: true,
              missingFields: true,
              provenance: true,
              createdAt: true,
              updatedAt: true,
            },
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

    logger.error("Error fetching institutions", error, {
      endpoint: "/api/institutions",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

