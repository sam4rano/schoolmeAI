import { Prisma } from "@prisma/client"

export interface InstitutionFilters {
  search?: string
  type?: "university" | "polytechnic" | "college" | "nursing" | "military"
  ownership?: "federal" | "state" | "private"
  state?: string
  missingWebsite?: boolean
}

export interface InstitutionQueryOptions {
  includePrograms?: boolean
  programLimit?: number
  includeCount?: boolean
  skip?: number
  take?: number
}

export function buildInstitutionWhere(filters: InstitutionFilters): Prisma.InstitutionWhereInput {
  const where: Prisma.InstitutionWhereInput = {}

  if (filters.search) {
    where.name = {
      contains: filters.search,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  if (filters.type) {
    where.type = filters.type
  }

  if (filters.ownership) {
    where.ownership = filters.ownership
  }

  if (filters.state) {
    where.state = filters.state
  }

  if (filters.missingWebsite) {
    where.OR = [
      { website: null },
      { website: "" },
    ]
  }

  return where
}

export function buildInstitutionQuery(
  filters: InstitutionFilters,
  options: InstitutionQueryOptions = {}
): Prisma.InstitutionFindManyArgs {
  const where = buildInstitutionWhere(filters)

  const include: Prisma.InstitutionInclude = {}
  
  if (options.includePrograms) {
    include.programs = {
      take: options.programLimit || 5,
    }
  }

  if (options.includeCount) {
    include._count = {
      select: { programs: true },
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

