import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const programSchema = z.object({
  name: z.string().min(1),
  institution_name: z.string().min(1),
  institutionId: z.string().uuid().optional().or(z.string().optional()),
  faculty: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  degreeType: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  utmeSubjects: z.array(z.string()).optional(),
  olevelSubjects: z.array(z.string()).optional(),
  admissionRequirements: z.record(z.any()).optional().nullable(),
  tuitionFees: z.record(z.any()).optional().nullable(),
  careerProspects: z.array(z.string()).optional(),
  courseCurriculum: z.record(z.any()).optional().nullable(),
  officialUrl: z.string().url().optional().nullable(),
  contact: z.record(z.any()).optional().nullable(),
  accreditationStatus: z.string().optional().nullable(),
  source_url: z.string().url().optional(),
  license: z.string().optional(),
})

const importSchema = z.object({
  programs: z.array(programSchema),
  source: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = importSchema.parse(body)

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    for (const progData of validatedData.programs) {
      try {
        // Find institution by name
        let institution = await prisma.institution.findFirst({
          where: {
            name: {
              equals: progData.institution_name,
              mode: "insensitive",
            },
          },
        })

        // If institution not found and institutionId provided, use that
        if (!institution && progData.institutionId) {
          institution = await prisma.institution.findUnique({
            where: { id: progData.institutionId },
          })
        }

        if (!institution) {
          results.errors.push(`${progData.name}: Institution "${progData.institution_name}" not found`)
          continue
        }

        // Check if program already exists
        const existing = await prisma.program.findFirst({
          where: {
            name: {
              equals: progData.name,
              mode: "insensitive",
            },
            institutionId: institution.id,
          },
        })

        const provenance = {
          source_url: progData.source_url || "",
          fetched_at: new Date().toISOString(),
          license: progData.license || "Unknown",
        }

        const contact = progData.contact || {}

        // Prepare data object, only including defined fields
        const updateData: any = {
          name: progData.name,
          lastVerifiedAt: new Date(),
          dataQualityScore: calculateQualityScore(progData),
        }
        
        // Add missingFields only if it exists in schema
        const missingFields = identifyMissingFields(progData)
        if (missingFields.length > 0) {
          updateData.missingFields = missingFields
        }

        // Only add fields that are not null/undefined
        if (progData.faculty !== undefined && progData.faculty !== null) updateData.faculty = progData.faculty
        if (progData.department !== undefined && progData.department !== null) updateData.department = progData.department
        if (progData.degreeType !== undefined && progData.degreeType !== null) updateData.degreeType = progData.degreeType
        if (progData.description !== undefined && progData.description !== null) updateData.description = progData.description
        if (progData.duration !== undefined && progData.duration !== null) updateData.duration = progData.duration
        if (progData.utmeSubjects !== undefined) updateData.utmeSubjects = progData.utmeSubjects || []
        if (progData.olevelSubjects !== undefined) updateData.olevelSubjects = progData.olevelSubjects || []
        if (progData.admissionRequirements !== undefined && progData.admissionRequirements !== null) updateData.admissionRequirements = progData.admissionRequirements
        if (progData.tuitionFees !== undefined && progData.tuitionFees !== null) updateData.tuitionFees = progData.tuitionFees
        if (progData.careerProspects !== undefined) updateData.careerProspects = progData.careerProspects || []
        if (progData.courseCurriculum !== undefined && progData.courseCurriculum !== null) updateData.courseCurriculum = progData.courseCurriculum
        if (progData.officialUrl !== undefined && progData.officialUrl !== null) updateData.officialUrl = progData.officialUrl
        if (Object.keys(contact).length > 0) updateData.contact = contact
        if (progData.accreditationStatus !== undefined && progData.accreditationStatus !== null) updateData.accreditationStatus = progData.accreditationStatus
        updateData.provenance = provenance

        if (existing) {
          // Update existing program - merge with existing data
          if (existing.faculty && !updateData.faculty) updateData.faculty = existing.faculty
          if (existing.department && !updateData.department) updateData.department = existing.department
          if (existing.degreeType && !updateData.degreeType) updateData.degreeType = existing.degreeType
          if (existing.description && !updateData.description) updateData.description = existing.description
          if (existing.duration && !updateData.duration) updateData.duration = existing.duration
          if (existing.utmeSubjects && (!updateData.utmeSubjects || updateData.utmeSubjects.length === 0)) updateData.utmeSubjects = existing.utmeSubjects
          if (existing.admissionRequirements && !updateData.admissionRequirements) updateData.admissionRequirements = existing.admissionRequirements
          if (existing.tuitionFees && !updateData.tuitionFees) updateData.tuitionFees = existing.tuitionFees
          if (existing.courseCurriculum && !updateData.courseCurriculum) updateData.courseCurriculum = existing.courseCurriculum
          if (existing.officialUrl && !updateData.officialUrl) updateData.officialUrl = existing.officialUrl
          if (existing.accreditationStatus && !updateData.accreditationStatus) updateData.accreditationStatus = existing.accreditationStatus
          updateData.provenance = {
            ...(existing.provenance as any),
            ...provenance,
          }
          updateData.updatedAt = new Date()

          await prisma.program.update({
            where: { id: existing.id },
            data: updateData,
          })
          results.updated++
        } else {
          // Create new program - build complete data object
          const createData: any = {
            name: progData.name,
            institutionId: institution.id,
            lastVerifiedAt: new Date(),
            dataQualityScore: calculateQualityScore(progData),
            utmeSubjects: progData.utmeSubjects || [],
            olevelSubjects: progData.olevelSubjects || [],
            careerProspects: progData.careerProspects || [],
            missingFields: identifyMissingFields(progData),
            provenance: provenance,
          }
          
          // Add optional fields only if they exist
          if (progData.faculty) createData.faculty = progData.faculty
          if (progData.department) createData.department = progData.department
          if (progData.degreeType) createData.degreeType = progData.degreeType
          if (progData.description) createData.description = progData.description
          if (progData.duration) createData.duration = progData.duration
          if (progData.admissionRequirements) createData.admissionRequirements = progData.admissionRequirements
          if (progData.tuitionFees) createData.tuitionFees = progData.tuitionFees
          if (progData.courseCurriculum) createData.courseCurriculum = progData.courseCurriculum
          if (progData.officialUrl) createData.officialUrl = progData.officialUrl
          if (progData.accreditationStatus) createData.accreditationStatus = progData.accreditationStatus
          if (Object.keys(contact).length > 0) createData.contact = contact
          
          await prisma.program.create({
            data: createData,
          })
          results.created++
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        results.errors.push(`${progData.name}: ${errorMsg}`)
        console.error(`Error importing ${progData.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.created} new programs, updated ${results.updated} existing programs`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error importing programs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateQualityScore(data: any): number {
  let score = 0
  const required = ["name"]
  const optional = [
    "description",
    "degreeType",
    "utmeSubjects",
    "olevelSubjects",
    "admissionRequirements",
    "duration",
    "careerProspects",
  ]

  for (const field of required) {
    if (data[field]) score += 30
  }

  for (const field of optional) {
    if (data[field] && (Array.isArray(data[field]) ? data[field].length > 0 : true)) {
      score += 10
    }
  }

  return Math.min(100, score)
}

function identifyMissingFields(data: any): string[] {
  const optional = [
    "description",
    "degreeType",
    "utmeSubjects",
    "olevelSubjects",
    "admissionRequirements",
    "duration",
    "careerProspects",
    "tuitionFees",
    "officialUrl",
  ]
  const missing: string[] = []

  for (const field of optional) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      missing.push(field)
    }
  }

  return missing
}

