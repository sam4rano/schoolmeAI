import { prisma } from "@/lib/prisma"

interface CreateNotificationParams {
  userId: string
  type: "deadline_reminder" | "watchlist_update" | "new_program" | "cutoff_update" | "fee_update" | "general"
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: params.metadata || undefined,
      },
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    // Don't throw - notifications shouldn't break the main flow
    return null
  }
}

// Check for deadline reminders
export async function checkDeadlineReminders() {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Find programs with deadlines in the next 7 or 30 days
    const programsWithDeadlines = await prisma.program.findMany({
      where: {
        applicationDeadline: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            state: true,
          },
        },
        watchlistItems: {
          include: {
            user: true,
          },
        },
      },
    })

    const notifications: CreateNotificationParams[] = []

    for (const program of programsWithDeadlines) {
      if (!program.applicationDeadline) continue

      const deadline = new Date(program.applicationDeadline)
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      for (const watchlistItem of program.watchlistItems) {
        // Check if user was already notified (check metadata manually)
        const recentNotifications = await prisma.notification.findMany({
          where: {
            userId: watchlistItem.userId,
            type: "deadline_reminder",
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24 hours
            },
          },
        })

        const existingNotification = recentNotifications.find((n) => {
          const metadata = n.metadata as any
          return metadata?.programId === program.id
        })

        if (existingNotification) continue

        let title = ""
        let message = ""

        if (daysUntilDeadline <= 7) {
          title = `⚠️ Application Deadline Approaching: ${program.name}`
          message = `The application deadline for ${program.name} at ${program.institution.name} is in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""}. Don't miss out!`
        } else if (daysUntilDeadline <= 30) {
          title = `📅 Application Deadline Reminder: ${program.name}`
          message = `The application deadline for ${program.name} at ${program.institution.name} is in ${daysUntilDeadline} days. Start preparing your application!`
        }

        if (title && message) {
          notifications.push({
            userId: watchlistItem.userId,
            type: "deadline_reminder",
            title,
            message,
            link: `/programs/${program.id}`,
            metadata: {
              programId: program.id,
              institutionId: program.institutionId,
              deadline: program.applicationDeadline.toISOString(),
              daysUntilDeadline,
            },
          })
        }
      }
    }

    // Create all notifications
    for (const notification of notifications) {
      await createNotification(notification)
    }

    return { created: notifications.length }
  } catch (error) {
    console.error("Error checking deadline reminders:", error)
    return { created: 0, error }
  }
}

// Check for new programs (for users with watchlist preferences)
export async function checkNewPrograms() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find programs created in the last 24 hours
    const newPrograms = await prisma.program.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            state: true,
          },
        },
      },
    })

    // For now, notify all users about new programs
    // In the future, this could be filtered by user preferences
    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
    })

    const notifications: CreateNotificationParams[] = []

    for (const program of newPrograms) {
      for (const user of users) {
        // Check if user was already notified about this program (check metadata manually)
        const existingNotifications = await prisma.notification.findMany({
          where: {
            userId: user.id,
            type: "new_program",
          },
        })

        const existingNotification = existingNotifications.find((n) => {
          const metadata = n.metadata as any
          return metadata && typeof metadata === "object" && metadata.programId === program.id
        })

        if (existingNotification) continue

        notifications.push({
          userId: user.id,
          type: "new_program",
          title: `🆕 New Program Added: ${program.name}`,
          message: `A new program "${program.name}" has been added at ${program.institution.name}. Check it out!`,
          link: `/programs/${program.id}`,
          metadata: {
            programId: program.id,
            institutionId: program.institutionId,
          },
        })
      }
    }

    // Create all notifications
    for (const notification of notifications) {
      await createNotification(notification)
    }

    return { created: notifications.length }
  } catch (error) {
    console.error("Error checking new programs:", error)
    return { created: 0, error }
  }
}

