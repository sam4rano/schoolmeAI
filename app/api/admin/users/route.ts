import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"

const getUsersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  role: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const validatedData = getUsersSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      role: searchParams.get("role"),
    })

    const where: any = {}

    if (validatedData.search) {
      where.OR = [
        { email: { contains: validatedData.search, mode: "insensitive" } },
        { profile: { path: ["name"], string_contains: validatedData.search } },
      ]
    }

    if (validatedData.role && validatedData.role !== "all") {
      where.roles = { has: validatedData.role }
    }

    const skip = (validatedData.page - 1) * validatedData.limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          roles: true,
          profile: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: validatedData.limit,
      }),
      prisma.user.count({ where }),
    ])

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [
          watchlistItems,
          calculations,
          reviews,
          questions,
          answers,
        ] = await Promise.all([
          prisma.applicationsWatchlist.count({ where: { userId: user.id } }),
          (prisma as any).calculation.count({ where: { userId: user.id } }),
          prisma.review.count({ where: { userId: user.id } }),
          prisma.question.count({ where: { userId: user.id } }),
          prisma.answer.count({ where: { userId: user.id } }),
        ])

        return {
          id: user.id,
          email: user.email,
          roles: user.roles,
          name: (user.profile as any)?.name || "",
          stateOfOrigin: (user.profile as any)?.stateOfOrigin || "",
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats: {
            watchlistItems,
            calculations,
            reviews,
            questions,
            answers,
          },
        }
      })
    )

    return NextResponse.json({
      data: usersWithStats,
      pagination: {
        page: validatedData.page,
        limit: validatedData.limit,
        total,
        totalPages: Math.ceil(total / validatedData.limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

