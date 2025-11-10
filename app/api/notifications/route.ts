import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { requireAuth } from "@/lib/middleware/auth"

const getNotificationsSchema = z.object({
  status: z.enum(["unread", "read", "archived"]).optional(),
  type: z.enum(["deadline_reminder", "watchlist_update", "new_program", "cutoff_update", "fee_update", "general"]).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const validatedData = getNotificationsSchema.parse({
      status: searchParams.get("status"),
      type: searchParams.get("type"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    })

    const where: any = {
      userId: session.user.id,
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    const skip = (validatedData.page - 1) * validatedData.limit
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: validatedData.limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          status: "unread",
        },
      }),
    ])

    return NextResponse.json({
      data: notifications,
      meta: {
        total,
        page: validatedData.page,
        limit: validatedData.limit,
        totalPages: Math.ceil(total / validatedData.limit),
        unreadCount,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["deadline_reminder", "watchlist_update", "new_program", "cutoff_update", "fee_update", "general"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  link: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    // Only admins can create notifications for other users
    const isAdmin = session.user.roles?.includes("admin")
    const body = await request.json()
    const validatedData = createNotificationSchema.parse(body)

    if (!isAdmin && validatedData.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only create notifications for yourself." },
        { status: 403 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId: validatedData.userId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        link: validatedData.link,
        metadata: validatedData.metadata || undefined,
      },
    })

    return NextResponse.json({
      data: notification,
      message: "Notification created successfully",
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

