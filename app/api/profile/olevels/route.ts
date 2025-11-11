import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError } from "@/lib/utils/api-error-handler"
import { requireAuth } from "@/lib/middleware/auth"

const createOLevelSchema = z.object({
  examBody: z.enum(["WAEC", "NECO", "GCE", "NABTEB"]),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  grades: z.record(z.string(), z.string()), // {subject: grade}
})

const updateOLevelSchema = z.object({
  examBody: z.enum(["WAEC", "NECO", "GCE", "NABTEB"]).optional(),
  year: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
  grades: z.record(z.string(), z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const oLevels = await prisma.oLevel.findMany({
      where: { userId: session.user.id },
      orderBy: { year: 'desc' },
    })

    return NextResponse.json({
      data: oLevels,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    const validatedData = createOLevelSchema.parse(body)

    // Calculate points (simple calculation - can be enhanced)
    const gradePoints: Record<string, number> = {
      "A1": 8, "B2": 7, "B3": 6, "C4": 5, "C5": 4, "C6": 3, "D7": 2, "E8": 1, "F9": 0,
      "A": 8, "B": 7, "C": 6, "D": 5, "E": 4, "F": 3,
    }

    let totalPoints = 0
    let subjectCount = 0
    for (const [subject, grade] of Object.entries(validatedData.grades)) {
      const points = gradePoints[grade.toUpperCase()] || 0
      totalPoints += points
      subjectCount++
    }

    const averagePoints = subjectCount > 0 ? totalPoints / subjectCount : 0
    const computedSummary = `${subjectCount} subjects, ${totalPoints} points`

    const oLevel = await prisma.oLevel.create({
      data: {
        userId: session.user.id,
        examBody: validatedData.examBody,
        year: validatedData.year,
        grades: validatedData.grades,
        computedPoints: averagePoints,
        computedSummary,
      },
    })

    return NextResponse.json({
      data: oLevel,
      message: "O-level results added successfully",
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "O-level ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await prisma.oLevel.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "O-level result not found or unauthorized" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateOLevelSchema.parse(body)

    const updateData: any = {}
    if (validatedData.examBody !== undefined) updateData.examBody = validatedData.examBody
    if (validatedData.year !== undefined) updateData.year = validatedData.year
    if (validatedData.grades !== undefined) {
      updateData.grades = validatedData.grades
      
      // Recalculate points
      const gradePoints: Record<string, number> = {
        "A1": 8, "B2": 7, "B3": 6, "C4": 5, "C5": 4, "C6": 3, "D7": 2, "E8": 1, "F9": 0,
        "A": 8, "B": 7, "C": 6, "D": 5, "E": 4, "F": 3,
      }

      let totalPoints = 0
      let subjectCount = 0
      for (const [subject, grade] of Object.entries(validatedData.grades)) {
        const points = gradePoints[grade.toUpperCase()] || 0
        totalPoints += points
        subjectCount++
      }

      const averagePoints = subjectCount > 0 ? totalPoints / subjectCount : 0
      updateData.computedPoints = averagePoints
      updateData.computedSummary = `${subjectCount} subjects, ${totalPoints} points`
    }

    const oLevel = await prisma.oLevel.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      data: oLevel,
      message: "O-level results updated successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ("response" in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "O-level ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await prisma.oLevel.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "O-level result not found or unauthorized" },
        { status: 404 }
      )
    }

    await prisma.oLevel.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "O-level results deleted successfully",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

