import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { PAGINATION, HTTP_STATUS } from "@/lib/constants"
import { getCached, generateCacheKey, CACHE_CONFIG, CACHE_TAGS } from "@/lib/cache"

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
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PAGE)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_LIMIT)),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = searchSchema.parse(params)

    const { query, type, ownership, state, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = validatedParams

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

    // Generate cache key
    const cacheKey = generateCacheKey("institutions", { query, type, ownership, state, page, limit })

    // Fetch with caching
    const [institutionsRaw, total] = await getCached(
      cacheKey,
      async () => {
        return Promise.all([
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
                take: 5,
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
                  applicationDeadline: true,
                  officialUrl: true,
                  accreditationStatus: true,
                  lastVerifiedAt: true,
                  dataQualityScore: true,
                  missingFields: true,
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
      },
      CACHE_CONFIG.INSTITUTIONS_TTL,
      [CACHE_TAGS.INSTITUTIONS]
    )

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
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    logger.error("Error fetching institutions", error, {
      endpoint: "/api/institutions",
      method: "GET",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

