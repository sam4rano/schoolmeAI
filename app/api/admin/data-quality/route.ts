import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/middleware/admin"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const issueType = searchParams.get("issueType") // "missingWebsite" | "missingCutoff" | "missingDescription"
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get overall stats
    const [
      totalInstitutions,
      totalPrograms,
      institutionsWithoutWebsite,
      allPrograms,
      programsWithoutDescription,
    ] = await Promise.all([
      prisma.institution.count(),
      prisma.program.count(),
      prisma.institution.count({
        where: {
          OR: [
            { website: null },
            { website: "" },
          ],
        },
      }),
      // For JSON fields, we need to fetch and filter in JavaScript
      prisma.program.findMany({
        select: { id: true, cutoffHistory: true },
      }),
      prisma.program.count({
        where: {
          OR: [
            { description: null } as any,
            { description: "" } as any,
          ],
        },
      }),
    ])

    // Filter programs without cutoff history
    const programsWithoutCutoff = allPrograms.filter(p => {
      if (!p.cutoffHistory) return true
      if (Array.isArray(p.cutoffHistory)) {
        return p.cutoffHistory.length === 0
      }
      return false
    }).length

    // Calculate data quality score
    const websiteScore = totalInstitutions > 0
      ? ((totalInstitutions - institutionsWithoutWebsite) / totalInstitutions) * 50
      : 0
    const cutoffScore = totalPrograms > 0
      ? ((totalPrograms - programsWithoutCutoff) / totalPrograms) * 30
      : 0
    const descriptionScore = totalPrograms > 0
      ? ((totalPrograms - programsWithoutDescription) / totalPrograms) * 20
      : 0

    const overallScore = Math.round(websiteScore + cutoffScore + descriptionScore)

    // Get specific issues if requested
    let issues: any[] = []

    if (issueType === "missingWebsite") {
      const institutions = await prisma.institution.findMany({
        where: {
          OR: [
            { website: null },
            { website: "" },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
          ownership: true,
          state: true,
          _count: {
            select: { programs: true },
          },
        },
        take: limit,
        orderBy: {
          name: "asc",
        },
      })
      issues = institutions.map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: "institution",
        issue: "missingWebsite",
        metadata: {
          type: inst.type,
          ownership: inst.ownership,
          state: inst.state,
          programsCount: inst._count.programs,
        },
      }))
    } else if (issueType === "missingCutoff") {
      // For JSON fields, fetch all and filter in JavaScript
      const allPrograms = await prisma.program.findMany({
        select: { id: true, cutoffHistory: true },
      })
      const programsWithoutCutoffIds = allPrograms
        .filter(p => {
          if (!p.cutoffHistory) return true
          if (Array.isArray(p.cutoffHistory)) {
            return p.cutoffHistory.length === 0
          }
          return false
        })
        .map(p => p.id)
      
      const programs = await prisma.program.findMany({
        where: {
          id: { in: programsWithoutCutoffIds },
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
        take: limit,
        orderBy: {
          name: "asc",
        },
      })
      issues = programs.map((prog) => ({
        id: prog.id,
        name: prog.name,
        type: "program",
        issue: "missingCutoff",
        metadata: {
          degreeType: prog.degreeType,
          institution: prog.institution.name,
          institutionId: prog.institution.id,
          institutionType: prog.institution.type,
          state: prog.institution.state,
        },
      }))
    } else if (issueType === "missingDescription") {
      const programs = await prisma.program.findMany({
        where: {
          OR: [
            { description: null } as any,
            { description: "" } as any,
          ],
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
        take: limit,
        orderBy: {
          name: "asc",
        },
      })
      issues = programs.map((prog) => ({
        id: prog.id,
        name: prog.name,
        type: "program",
        issue: "missingDescription",
        metadata: {
          degreeType: prog.degreeType,
          institution: prog.institution.name,
          institutionId: prog.institution.id,
          institutionType: prog.institution.type,
          state: prog.institution.state,
        },
      }))
    }

    return NextResponse.json({
      metrics: {
        totalInstitutions,
        totalPrograms,
        institutionsWithoutWebsite,
        programsWithoutCutoff,
        programsWithoutDescription,
        overallScore,
        websiteScore: Math.round(websiteScore),
        cutoffScore: Math.round(cutoffScore),
        descriptionScore: Math.round(descriptionScore),
      },
      issues,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

