import { prisma } from "@/lib/prisma"
import { createEmbedding } from "./embeddings"

/**
 * Generate embeddings for all institutions
 */
export async function generateInstitutionEmbeddings() {
  const institutions = await prisma.institution.findMany({
    include: {
      programs: {
        take: 10,
      },
    },
  })

  console.log(`Generating embeddings for ${institutions.length} institutions...`)

  for (const institution of institutions) {
    const content = `
Institution: ${institution.name}
Type: ${institution.type}
Ownership: ${institution.ownership}
Location: ${institution.city}, ${institution.state}
${institution.website ? `Website: ${institution.website}` : ""}
${institution.accreditationStatus ? `Accreditation: ${institution.accreditationStatus}` : ""}
${institution.programs.length > 0 ? `Programs: ${institution.programs.map((p) => p.name).join(", ")}` : ""}
    `.trim()

    await createEmbedding({
      entityType: "institution",
      entityId: institution.id,
      content,
      metadata: {
        title: institution.name,
        type: institution.type,
        ownership: institution.ownership,
        state: institution.state,
        city: institution.city,
      },
    })

    console.log(`✓ Generated embedding for ${institution.name}`)
  }

  console.log("✓ Institution embeddings complete")
}

/**
 * Generate embeddings for all programs
 */
export async function generateProgramEmbeddings() {
  const programs = await prisma.program.findMany({
    include: {
      institution: true,
    },
  })

  console.log(`Generating embeddings for ${programs.length} programs...`)

  for (const program of programs) {
    const cutoffInfo = program.cutoffHistory
      ? Array.isArray(program.cutoffHistory)
        ? program.cutoffHistory
        : JSON.parse(JSON.stringify(program.cutoffHistory))
      : []

    const latestCutoff = cutoffInfo.length > 0 ? cutoffInfo[0] : null

    const content = `
Program: ${program.name}
Institution: ${program.institution.name}
${program.faculty ? `Faculty: ${program.faculty}` : ""}
${program.department ? `Department: ${program.department}` : ""}
${program.degreeType ? `Degree Type: ${program.degreeType}` : ""}
${program.utmeSubjects.length > 0 ? `Required UTME Subjects: ${program.utmeSubjects.join(", ")}` : ""}
${latestCutoff ? `Latest Cutoff (${latestCutoff.year}): ${latestCutoff.cutoff}` : "Cutoff information not available"}
${cutoffInfo.length > 1 ? `Historical Cutoffs: ${cutoffInfo.slice(0, 5).map((c: any) => `${c.year}: ${c.cutoff}`).join(", ")}` : ""}
    `.trim()

    await createEmbedding({
      entityType: "program",
      entityId: program.id,
      content,
      metadata: {
        title: `${program.name} at ${program.institution.name}`,
        programName: program.name,
        institutionName: program.institution.name,
        institutionId: program.institutionId,
        faculty: program.faculty,
        department: program.department,
        degreeType: program.degreeType,
        latestCutoff: latestCutoff?.cutoff,
        latestCutoffYear: latestCutoff?.year,
      },
    })

    console.log(`✓ Generated embedding for ${program.name} at ${program.institution.name}`)
  }

  console.log("✓ Program embeddings complete")
}

/**
 * Generate all embeddings
 */
export async function generateAllEmbeddings() {
  console.log("Starting embedding generation...")
  await generateInstitutionEmbeddings()
  await generateProgramEmbeddings()
  console.log("✓ All embeddings generated successfully")
}

