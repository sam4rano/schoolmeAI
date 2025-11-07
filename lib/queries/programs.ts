import { Prisma } from "@prisma/client"

export interface ProgramFilters {
  search?: string
  course?: string
  institutionId?: string
  institutionType?: "university" | "polytechnic" | "college" | "nursing" | "military"
  degreeType?: string
  missingCutoff?: boolean
  missingDescription?: boolean
}

export interface ProgramQueryOptions {
  includeInstitution?: boolean
  institutionSelect?: {
    id?: boolean
    name?: boolean
    type?: boolean
    ownership?: boolean
    state?: boolean
  }
  skip?: number
  take?: number
}

export function buildProgramWhere(filters: ProgramFilters): Prisma.ProgramWhereInput {
  const where: Prisma.ProgramWhereInput = {}

  if (filters.institutionId) {
    where.institutionId = filters.institutionId
  }

  if (filters.institutionType) {
    where.institution = {
      type: filters.institutionType,
    }
  }

  if (filters.degreeType && filters.degreeType !== "all") {
    where.degreeType = filters.degreeType
  }

  if (filters.course) {
    where.name = {
      equals: filters.course,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  if (filters.missingCutoff) {
    where.cutoffHistory = null as any
  }

  if (filters.missingDescription) {
    where.OR = [
      { description: null } as any,
      { description: "" } as any,
    ]
  }

  if (filters.search && !filters.course) {
    const searchConditions = [
      {
        name: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        description: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        faculty: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        department: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        institution: {
          name: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
    ]

    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchConditions },
      ]
      delete where.OR
    } else {
      where.OR = searchConditions
    }
  }

  return where
}

export function buildProgramQuery(
  filters: ProgramFilters,
  options: ProgramQueryOptions = {}
): Prisma.ProgramFindManyArgs {
  const where = buildProgramWhere(filters)

  const include: Prisma.ProgramInclude = {}
  
  if (options.includeInstitution) {
    include.institution = {
      select: options.institutionSelect || {
        id: true,
        name: true,
        type: true,
        ownership: true,
        state: true,
      },
    }
  }

  return {
    where,
    include: Object.keys(include).length > 0 ? include : undefined,
    skip: options.skip,
    take: options.take,
    orderBy: {
      name: "asc",
    },
  }
}

