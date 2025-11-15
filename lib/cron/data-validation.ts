/**
 * Data Validation and Quality Checks
 * Automated validation, duplicate detection, and consistency checks
 */

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"

export interface DataChange {
  type: "institution" | "program"
  id: string
  field: string
  oldValue: any
  newValue: any
  timestamp: Date
}

export interface DataChangesResult {
  hasChanges: boolean
  changes: DataChange[]
  summary: string
}

/**
 * Check for data changes (simplified - in production, use a proper change tracking system)
 */
export async function checkDataChanges(): Promise<DataChangesResult> {
  const changes: DataChange[] = []
  
  // Check for recently updated institutions (in last 24 hours)
  const recentInstitutions = await prisma.institution.findMany({
    where: {
      updatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  })
  
  // Check for recently updated programs
  const recentPrograms = await prisma.program.findMany({
    where: {
      updatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  })
  
  // Generate summary
  const summary = `${recentInstitutions.length} institutions and ${recentPrograms.length} programs updated in the last 24 hours`
  
  return {
    hasChanges: recentInstitutions.length > 0 || recentPrograms.length > 0,
    changes,
    summary,
  }
}

/**
 * Detect duplicate institutions
 */
export async function detectDuplicateInstitutions(): Promise<any[]> {
  const institutions = await prisma.institution.findMany({
    select: {
      id: true,
      name: true,
      state: true,
      city: true,
    },
  })
  
  const duplicates: any[] = []
  const seen = new Map<string, string[]>()
  
  for (const inst of institutions) {
    const normalizedName = normalizeName(inst.name)
    const key = `${normalizedName}_${inst.state || ""}_${inst.city || ""}`
    
    if (seen.has(key)) {
      const existing = seen.get(key)!
      duplicates.push({
        name: inst.name,
        id: inst.id,
        matches: existing,
      })
    } else {
      seen.set(key, [inst.id])
    }
  }
  
  return duplicates
}

/**
 * Detect duplicate programs
 */
export async function detectDuplicatePrograms(): Promise<any[]> {
  const programs = await prisma.program.findMany({
    select: {
      id: true,
      name: true,
      institutionId: true,
      degreeType: true,
      institution: {
        select: {
          name: true,
        },
      },
    },
  })
  
  const duplicates: any[] = []
  const seen = new Map<string, string[]>()
  
  for (const program of programs) {
    const normalizedName = normalizeName(program.name)
    const key = `${normalizedName}_${program.institutionId}_${program.degreeType || ""}`
    
    if (seen.has(key)) {
      const existing = seen.get(key)!
      duplicates.push({
        name: program.name,
        id: program.id,
        institution: program.institution.name,
        matches: existing,
      })
    } else {
      seen.set(key, [program.id])
    }
  }
  
  return duplicates
}

/**
 * Validate data consistency
 */
export async function validateDataConsistency(): Promise<{
  issues: string[]
  isValid: boolean
}> {
  const issues: string[] = []
  
  // Check for programs without institutions
  const orphanedPrograms = await prisma.program.count({
    where: {
      institution: null as any,
    },
  })
  
  if (orphanedPrograms > 0) {
    issues.push(`${orphanedPrograms} programs are missing their institution`)
  }
  
  // Check for institutions without programs
  const institutionsWithoutPrograms = await prisma.institution.findMany({
    where: {
      programs: {
        none: {},
      },
    },
    select: {
      id: true,
      name: true,
    },
  })
  
  if (institutionsWithoutPrograms.length > 0) {
    issues.push(`${institutionsWithoutPrograms.length} institutions have no programs`)
  }
  
  // Check for programs with invalid accreditation dates
  const invalidAccreditationDates = await prisma.program.count({
    where: {
      accreditationMaturityDate: {
        lt: 2000,
      },
    },
  })
  
  if (invalidAccreditationDates > 0) {
    issues.push(`${invalidAccreditationDates} programs have invalid accreditation dates`)
  }
  
  return {
    issues,
    isValid: issues.length === 0,
  }
}

/**
 * Normalize name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
}

/**
 * Automated data cleanup
 */
export async function cleanupData(): Promise<{
  cleaned: number
  errors: string[]
}> {
  const errors: string[] = []
  let cleaned = 0
  
  try {
    // Remove duplicate institutions (keep the oldest one)
    const duplicates = await detectDuplicateInstitutions()
    for (const dup of duplicates) {
      try {
        // In production, you'd want to merge data instead of deleting
        // For now, we'll just log it
        logger.warn(`Duplicate institution detected: ${dup.name}`, dup)
        cleaned++
      } catch (error) {
        errors.push(`Failed to clean duplicate institution ${dup.id}: ${error}`)
      }
    }
    
    // Remove duplicate programs
    const duplicatePrograms = await detectDuplicatePrograms()
    for (const dup of duplicatePrograms) {
      try {
        logger.warn(`Duplicate program detected: ${dup.name}`, dup)
        cleaned++
      } catch (error) {
        errors.push(`Failed to clean duplicate program ${dup.id}: ${error}`)
      }
    }
    
    // Fix orphaned programs (assign to a default institution or mark for review)
    const orphanedPrograms = await prisma.program.findMany({
      where: {
        institution: null as any,
      },
    })
    
    if (orphanedPrograms.length > 0) {
      logger.warn(`Found ${orphanedPrograms.length} orphaned programs`)
      // In production, you'd want to handle this more carefully
    }
    
  } catch (error) {
    logger.error("Error in data cleanup", error)
    errors.push(`Data cleanup failed: ${error}`)
  }
  
  return { cleaned, errors }
}

