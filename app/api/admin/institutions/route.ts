import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { buildInstitutionQuery } from "@/lib/queries/institutions"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { logger } from "@/lib/utils/logger"

const createInstitutionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["university", "polytechnic", "college", "nursing", "military"]),
  ownership: z.enum(["federal", "state", "private"]),
  state: z.string().min(1),
  city: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")),
  contact: z.record(z.any()).optional(),
  accreditationStatus: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const filters = {
      search: searchParams.get("search") || undefined,
      type: (searchParams.get("type") && searchParams.get("type") !== "all") ? searchParams.get("type") as any : undefined,
      ownership: (searchParams.get("ownership") && searchParams.get("ownership") !== "all") ? searchParams.get("ownership") as any : undefined,
      missingWebsite: searchParams.get("missingWebsite") === "true",
    }

    const skip = (page - 1) * limit
    const query = buildInstitutionQuery(filters, {
      includeCount: true,
      skip,
      take: limit,
    })

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany(query),
      prisma.institution.count({ where: query.where || {} }),
    ])

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
    logger.error("Error in GET /api/admin/institutions", error, {
      endpoint: "/api/admin/institutions",
      method: "GET",
    })
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const data = createInstitutionSchema.parse(body)

    // Normalize website URL
    let website = data.website
    if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
      website = "https://" + website
    }

    const institution = await prisma.institution.create({
      data: {
        ...data,
        website: website || null,
      },
    })

    // Log audit event
    const { logAuditEvent } = await import("@/lib/utils/audit-logger")
    await logAuditEvent({
      userId: session.user.id,
      entityType: "institution",
      entityId: institution.id,
      action: "create",
      institutionId: institution.id,
    })

    return NextResponse.json({ data: institution }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

