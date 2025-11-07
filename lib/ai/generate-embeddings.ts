import { prisma } from "@/lib/prisma"
import { createEmbedding } from "./embeddings"

/**
 * Generate embeddings for all institutions
 */
export async function generateInstitutionEmbeddings() {
  const institutions = await prisma.institution.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      ownership: true,
      state: true,
      city: true,
      website: true,
      accreditationStatus: true,
      programs: {
        select: {
          name: true,
        },
        take: 10,
      },
    },
  })

  console.log(`Generating embeddings for ${institutions.length} institutions...`)

  for (const institution of institutions) {
    // Create comprehensive content for better searchability
    const programNames = institution.programs.map((p) => p.name).join(", ")
    const content = `
Institution: ${institution.name}
Also known as: ${institution.name}
Type: ${institution.type}
Ownership: ${institution.ownership}
Location: ${institution.city}, ${institution.state}, Nigeria
State: ${institution.state}
City: ${institution.city}
${institution.website ? `Website: ${institution.website}` : ""}
${institution.accreditationStatus ? `Accreditation Status: ${institution.accreditationStatus}` : ""}
${programNames ? `Offers programs in: ${programNames}` : ""}
${programNames ? `Courses available: ${programNames}` : ""}
${programNames ? `Study programs: ${programNames}` : ""}
This is a ${institution.type} institution located in ${institution.state} state, Nigeria.
Students can study ${programNames || "various programs"} at ${institution.name}.
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
  return { count: institutions.length }
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

    // Create comprehensive content for better searchability
    const cutoffText = latestCutoff 
      ? `The cutoff mark for ${program.name} at ${program.institution.name} in ${latestCutoff.year} was ${latestCutoff.cutoff}.`
      : "Cutoff information is not currently available."
    
    const historicalCutoffs = cutoffInfo.length > 1
      ? `Historical cutoff marks: ${cutoffInfo.slice(0, 5).map((c: any) => `${c.year}: ${c.cutoff}`).join(", ")}`
      : ""

    const content = `
Program: ${program.name}
Course: ${program.name}
Degree Program: ${program.name}
Institution: ${program.institution.name}
University: ${program.institution.name}
${program.faculty ? `Faculty: ${program.faculty}` : ""}
${program.department ? `Department: ${program.department}` : ""}
${program.degreeType ? `Degree Type: ${program.degreeType}` : ""}
${program.utmeSubjects.length > 0 ? `Required UTME Subjects: ${program.utmeSubjects.join(", ")}` : ""}
${program.utmeSubjects.length > 0 ? `JAMB Subjects: ${program.utmeSubjects.join(", ")}` : ""}
${cutoffText}
${historicalCutoffs}
You can study ${program.name} at ${program.institution.name} in ${program.institution.state} state, Nigeria.
The ${program.name} program is offered at ${program.institution.name}.
To study ${program.name} at ${program.institution.name}, you need to meet the cutoff requirements.
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
  return { count: programs.length }
}

/**
 * Generate all embeddings
 */
export async function generateAllEmbeddings() {
  console.log("Starting embedding generation...")
  const institutionResult = await generateInstitutionEmbeddings()
  const programResult = await generateProgramEmbeddings()
  console.log("✓ All embeddings generated successfully")
  return {
    institutions: institutionResult.count,
    programs: programResult.count,
    total: institutionResult.count + programResult.count,
  }
}

