import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const json = formData.get("json") as string | null
    const entityType = formData.get("entityType") as string

    if (!file && !json) {
      return NextResponse.json(
        { error: "File or JSON data is required" },
        { status: 400 }
      )
    }

    let data: any[]
    if (file) {
      const text = await file.text()
      if (file.name.endsWith(".json")) {
        data = JSON.parse(text)
      } else if (file.name.endsWith(".csv")) {
        // Simple CSV parser (can be enhanced)
        const lines = text.split("\n")
        const headers = lines[0].split(",")
        data = lines.slice(1).map((line) => {
          const values = line.split(",")
          const obj: any = {}
          headers.forEach((header, i) => {
            obj[header.trim()] = values[i]?.trim() || ""
          })
          return obj
        })
      } else {
        return NextResponse.json(
          { error: "Unsupported file format. Use JSON or CSV" },
          { status: 400 }
        )
      }
    } else if (json) {
      data = JSON.parse(json)
    } else {
      return NextResponse.json(
        { error: "File or JSON data is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Data must be an array" },
        { status: 400 }
      )
    }

    let count = 0
    const errors: string[] = []

    if (entityType === "institution") {
      for (const item of data) {
        try {
          await prisma.institution.create({
            data: {
              name: item.name,
              type: item.type,
              ownership: item.ownership,
              state: item.state,
              city: item.city,
              website: item.website || null,
              contact: item.contact || null,
              accreditationStatus: item.accreditationStatus || null,
            },
          })
          count++
        } catch (error) {
          errors.push(`Failed to create ${item.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    } else if (entityType === "program") {
      for (const item of data) {
        try {
          await prisma.program.create({
            data: {
              institutionId: item.institutionId,
              name: item.name,
              faculty: item.faculty || null,
              department: item.department || null,
              degreeType: item.degreeType || null,
              description: item.description || null,
              duration: item.duration || null,
              utmeSubjects: item.utmeSubjects || [],
              olevelSubjects: item.olevelSubjects || [],
              cutoffHistory: item.cutoffHistory || [],
              applicationDeadline: item.applicationDeadline ? new Date(item.applicationDeadline) : null,
              careerProspects: item.careerProspects || [],
            },
          })
          count++
        } catch (error) {
          errors.push(`Failed to create ${item.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    } else {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      )
    }

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        entityType: entityType,
        entityId: "bulk",
        action: "create",
        userId: session.user.id,
        metadata: {
          count,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
    })

    return NextResponse.json({
      data: {
        count,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.error("Error in bulk import:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

