import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Create sample user
  const hashedPassword = await bcrypt.hash("password123", 10)
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      hashedPassword,
      profile: {
        name: "Test User",
        stateOfOrigin: "Lagos",
      } as any,
    },
  })
  console.log("Created user:", user.email)

  // Sample institutions (20 major Nigerian institutions)
  const institutions = [
    {
      name: "University of Lagos",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Lagos",
      city: "Lagos",
      website: "https://unilag.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@unilag.edu.ng",
        phone: "+234-123-456-7890",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
        license: "Public Domain",
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 85,
      missingFields: [],
    },
    {
      name: "University of Ibadan",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Oyo",
      city: "Ibadan",
      website: "https://ui.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@ui.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "University of Nigeria, Nsukka",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Enugu",
      city: "Nsukka",
      website: "https://unn.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@unn.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "Ahmadu Bello University",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Kaduna",
      city: "Zaria",
      website: "https://abu.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@abu.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "Obafemi Awolowo University",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Osun",
      city: "Ile-Ife",
      website: "https://oauife.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@oauife.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "University of Benin",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Edo",
      city: "Benin City",
      website: "https://uniben.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@uniben.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "University of Ilorin",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Kwara",
      city: "Ilorin",
      website: "https://unilorin.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@unilorin.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "University of Port Harcourt",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Rivers",
      city: "Port Harcourt",
      website: "https://uniport.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@uniport.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "Lagos State University",
      type: "university" as const,
      ownership: "state" as const,
      state: "Lagos",
      city: "Lagos",
      website: "https://lasu.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@lasu.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 75,
      missingFields: ["phone"],
    },
    {
      name: "Covenant University",
      type: "university" as const,
      ownership: "private" as const,
      state: "Ogun",
      city: "Ota",
      website: "https://covenantuniversity.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@covenantuniversity.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 75,
      missingFields: ["phone"],
    },
    {
      name: "Yaba College of Technology",
      type: "polytechnic" as const,
      ownership: "federal" as const,
      state: "Lagos",
      city: "Lagos",
      website: "https://yabatech.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@yabatech.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 70,
      missingFields: ["phone"],
    },
    {
      name: "Federal Polytechnic, Ilaro",
      type: "polytechnic" as const,
      ownership: "federal" as const,
      state: "Ogun",
      city: "Ilaro",
      website: "https://federalpolyilaro.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@federalpolyilaro.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 70,
      missingFields: ["phone"],
    },
    {
      name: "Lagos State Polytechnic",
      type: "polytechnic" as const,
      ownership: "state" as const,
      state: "Lagos",
      city: "Lagos",
      website: "https://mylaspotech.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@mylaspotech.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 70,
      missingFields: ["phone"],
    },
    {
      name: "University of Abuja",
      type: "university" as const,
      ownership: "federal" as const,
      state: "FCT",
      city: "Abuja",
      website: "https://uniabuja.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@uniabuja.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "Bayero University Kano",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Kano",
      city: "Kano",
      website: "https://buk.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@buk.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "University of Calabar",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Cross River",
      city: "Calabar",
      website: "https://unical.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@unical.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "Nnamdi Azikiwe University",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Anambra",
      city: "Awka",
      website: "https://unizik.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@unizik.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "University of Jos",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Plateau",
      city: "Jos",
      website: "https://unijos.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@unijos.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "University of Maiduguri",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Borno",
      city: "Maiduguri",
      website: "https://unimaid.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@unimaid.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
    {
      name: "Federal University of Technology, Akure",
      type: "university" as const,
      ownership: "federal" as const,
      state: "Ondo",
      city: "Akure",
      website: "https://futa.edu.ng",
      accreditationStatus: "Accredited",
      contact: {
        email: "info@futa.edu.ng",
      },
      provenance: {
        source_url: "https://nuc.edu.ng",
        fetched_at: new Date().toISOString(),
      },
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
      missingFields: ["phone"],
    },
  ]

  // Create institutions
  const createdInstitutions = []
  for (const instData of institutions) {
    // Check if institution exists
    const existing = await prisma.institution.findFirst({
      where: { name: instData.name },
    })

    let institution
    if (existing) {
      institution = await prisma.institution.update({
        where: { id: existing.id },
        data: instData as any,
      })
    } else {
      institution = await prisma.institution.create({
        data: instData as any,
      })
    }
    createdInstitutions.push(institution)
    console.log(`Created institution: ${institution.name}`)
  }

  // Create sample programs for first institution
  const firstInstitution = createdInstitutions[0]
  const programs = [
    {
      name: "Medicine and Surgery",
      institutionId: firstInstitution.id,
      faculty: "College of Medicine",
      department: "Medicine",
      degreeType: "MBBS",
      utmeSubjects: ["Physics", "Chemistry", "Biology"],
      cutoffHistory: [
        {
          year: 2023,
          cutoff: 280,
          admission_mode: "UTME",
          source_url: "https://unilag.edu.ng/admissions/2023",
          confidence: "verified",
        },
        {
          year: 2022,
          cutoff: 275,
          admission_mode: "UTME",
          source_url: "https://unilag.edu.ng/admissions/2022",
          confidence: "verified",
        },
      ],
      lastVerifiedAt: new Date(),
      dataQualityScore: 85,
    },
    {
      name: "Computer Science",
      institutionId: firstInstitution.id,
      faculty: "Faculty of Science",
      department: "Computer Science",
      degreeType: "BSc",
      utmeSubjects: ["Mathematics", "Physics", "Chemistry"],
      cutoffHistory: [
        {
          year: 2023,
          cutoff: 240,
          admission_mode: "UTME",
          source_url: "https://unilag.edu.ng/admissions/2023",
          confidence: "verified",
        },
      ],
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
    },
    {
      name: "Electrical Engineering",
      institutionId: firstInstitution.id,
      faculty: "Faculty of Engineering",
      department: "Electrical Engineering",
      degreeType: "BEng",
      utmeSubjects: ["Mathematics", "Physics", "Chemistry"],
      cutoffHistory: [
        {
          year: 2023,
          cutoff: 250,
          admission_mode: "UTME",
          source_url: "https://unilag.edu.ng/admissions/2023",
          confidence: "verified",
        },
      ],
      lastVerifiedAt: new Date(),
      dataQualityScore: 80,
    },
  ]

  for (const programData of programs) {
    const program = await prisma.program.create({
      data: programData as any,
    })
    console.log(`Created program: ${program.name}`)
  }

  console.log("Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

