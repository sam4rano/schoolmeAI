/**
 * Full-text search utilities for PostgreSQL
 * Uses PostgreSQL's full-text search capabilities
 */

import { Prisma } from "@prisma/client"

/**
 * Build full-text search condition for institution names
 */
export function buildInstitutionFullTextSearch(searchTerm: string): Prisma.InstitutionWhereInput {
  if (!searchTerm || !searchTerm.trim()) {
    return {}
  }

  // Use raw SQL for full-text search
  // This will be used in raw queries
  return {
    // For now, fallback to case-insensitive contains
    // Full-text search requires raw SQL queries
    name: {
      contains: searchTerm.trim(),
      mode: Prisma.QueryMode.insensitive,
    },
  }
}

/**
 * Build full-text search condition for program names
 */
export function buildProgramFullTextSearch(searchTerm: string): Prisma.ProgramWhereInput {
  if (!searchTerm || !searchTerm.trim()) {
    return {}
  }

  return {
    OR: [
      {
        name: {
          contains: searchTerm.trim(),
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        description: {
          contains: searchTerm.trim(),
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ],
  }
}

/**
 * Execute full-text search query using raw SQL
 * This provides better performance than contains queries
 */
export async function executeFullTextSearch(
  prisma: any,
  table: "institutions" | "programs",
  searchTerm: string,
  limit: number = 20
): Promise<any[]> {
  if (!searchTerm || !searchTerm.trim()) {
    return []
  }

  const sanitizedTerm = searchTerm.trim().replace(/'/g, "''") // Escape single quotes

  if (table === "institutions") {
    return await prisma.$queryRaw`
      SELECT * FROM institutions
      WHERE to_tsvector('english', name) @@ plainto_tsquery('english', ${sanitizedTerm})
      ORDER BY ts_rank(to_tsvector('english', name), plainto_tsquery('english', ${sanitizedTerm})) DESC
      LIMIT ${limit}
    `
  } else {
    return await prisma.$queryRaw`
      SELECT * FROM programs
      WHERE to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')) 
            @@ plainto_tsquery('english', ${sanitizedTerm})
      ORDER BY ts_rank(
        to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')),
        plainto_tsquery('english', ${sanitizedTerm})
      ) DESC
      LIMIT ${limit}
    `
  }
}

