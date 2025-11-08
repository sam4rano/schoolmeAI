import { Prisma } from "@prisma/client"

export interface InstitutionFilters {
  search?: string
  type?: "university" | "polytechnic" | "college" | "nursing" | "military" | "all"
  ownership?: "federal" | "state" | "private" | "all"
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
  const conditions: Prisma.InstitutionWhereInput[] = []

  if (filters.search && filters.search.trim()) {
    conditions.push({
      name: {
        contains: filters.search.trim(),
        mode: Prisma.QueryMode.insensitive,
      },
    })
  }

  if (filters.type && filters.type !== "all") {
    conditions.push({ type: filters.type as "university" | "polytechnic" | "college" | "nursing" | "military" })
  }

  if (filters.ownership && filters.ownership !== "all") {
    conditions.push({ ownership: filters.ownership as "federal" | "state" | "private" })
  }

  if (filters.state && filters.state.trim()) {
    conditions.push({ state: filters.state.trim() })
  }

  if (filters.missingWebsite) {
    conditions.push({
      OR: [
        { website: null },
        { website: "" },
      ],
    })
  }

  // If we have multiple conditions, combine them with AND
  if (conditions.length === 0) {
    return {}
  } else if (conditions.length === 1) {
    return conditions[0]
  } else {
    return { AND: conditions }
  }
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

