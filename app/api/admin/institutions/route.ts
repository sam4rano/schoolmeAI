import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"

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
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type")
    const ownership = searchParams.get("ownership")
    const missingWebsite = searchParams.get("missingWebsite") === "true"

    const where: any = {}
    
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      }
    }
    
    if (type) {
      where.type = type
    }
    
    if (ownership) {
      where.ownership = ownership
    }
    
    if (missingWebsite) {
      where.OR = [
        { website: null },
        { website: "" },
      ]
    }

    const skip = (page - 1) * limit

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { programs: true },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.institution.count({ where }),
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
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error fetching institutions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
    await prisma.auditEvent.create({
      data: {
        entityType: "institution",
        entityId: institution.id,
        action: "create",
        userId: session.user.id,
        institutionId: institution.id,
      },
    })

    return NextResponse.json({ data: institution }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating institution:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

