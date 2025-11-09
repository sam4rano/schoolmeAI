import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"

/**
 * @swagger
 * /api/institutions:
 *   get:
 *     summary: Get list of institutions
 *     tags: [Institutions]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for institution name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [university, polytechnic, college, nursing, military]
 *         description: Filter by institution type
 *       - in: query
 *         name: ownership
 *         schema:
 *           type: string
 *           enum: [federal, state, private]
 *         description: Filter by ownership
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of institutions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Institution'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

