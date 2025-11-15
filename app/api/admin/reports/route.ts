/**
 * Admin API for generating reports
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/middleware/admin"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "overview"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date()
    
    let report: any = {}
    
    switch (reportType) {
      case "overview":
        report = await generateOverviewReport(start, end)
        break
      case "user-activity":
        report = await generateUserActivityReport(start, end)
        break
      case "data-usage":
        report = await generateDataUsageReport(start, end)
        break
      case "performance":
        report = await generatePerformanceReport(start, end)
        break
      case "errors":
        report = await generateErrorReport(start, end)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
    
    return NextResponse.json({ data: report })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Generate overview report
 */
async function generateOverviewReport(start: Date, end: Date) {
  const [
    totalUsers,
    newUsers,
    totalInstitutions,
    totalPrograms,
    totalCalculations,
    applicationsWatchlistCount,
    institutionWatchlistCount,
    totalReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    }),
    prisma.institution.count(),
    prisma.program.count(),
    prisma.calculation.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    }),
    prisma.applicationsWatchlist.count(),
    prisma.institutionWatchlist.count(),
    prisma.review.count(),
  ])
  
  const totalWatchlistItems = applicationsWatchlistCount + institutionWatchlistCount
  
  return {
    period: { start, end },
    users: {
      total: totalUsers,
      new: newUsers,
    },
    data: {
      institutions: totalInstitutions,
      programs: totalPrograms,
    },
    activity: {
      calculations: totalCalculations,
      watchlistItems: totalWatchlistItems,
      reviews: totalReviews,
    },
  }
}

/**
 * Generate user activity report
 */
async function generateUserActivityReport(start: Date, end: Date) {
  const activeUsers = await prisma.user.findMany({
    where: {
      OR: [
        {
          calculations: {
            some: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
        },
        {
          watchlistItems: {
            some: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          calculations: true,
          watchlistItems: true,
        },
      },
    },
  })
  
  return {
    period: { start, end },
    activeUsers: activeUsers.length,
    users: activeUsers.map((user) => ({
      id: user.id,
      email: user.email,
      joinedAt: user.createdAt,
      calculations: user._count.calculations,
      watchlistItems: user._count.watchlistItems,
    })),
  }
}

/**
 * Generate data usage report
 */
async function generateDataUsageReport(start: Date, end: Date) {
  const [
    institutionsViewed,
    programsViewed,
    searchesPerformed,
    recommendationsGenerated,
  ] = await Promise.all([
    // This would require tracking views - simplified for now
    prisma.institution.count(),
    prisma.program.count(),
    // Searches would need to be tracked
    0,
    prisma.calculation.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    }),
  ])
  
  return {
    period: { start, end },
    dataUsage: {
      institutionsViewed,
      programsViewed,
      searchesPerformed,
      recommendationsGenerated,
    },
  }
}

/**
 * Generate performance report
 */
async function generatePerformanceReport(start: Date, end: Date) {
  // This would require performance monitoring - simplified for now
  return {
    period: { start, end },
    performance: {
      averageResponseTime: "N/A",
      errorRate: "N/A",
      uptime: "N/A",
    },
    note: "Performance monitoring not yet implemented",
  }
}

/**
 * Generate error report
 */
async function generateErrorReport(start: Date, end: Date) {
  // This would require error tracking - simplified for now
  return {
    period: { start, end },
    errors: [],
    note: "Error tracking not yet implemented",
  }
}

