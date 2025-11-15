/**
 * Scheduled Task Handlers
 * Defines all automated data update tasks
 */

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { cronScheduler, ScheduledTask } from "./scheduler"
import { checkDataChanges, detectDuplicateInstitutions, detectDuplicatePrograms } from "./data-validation"
import { sendAdminNotificationEmail } from "@/lib/email/notifications"

/**
 * Task: Check for data changes and notify admins
 */
async function checkDataChangesTask() {
  logger.info("Running data changes check task")
  
  try {
    const changes = await checkDataChanges()
    
    if (changes.hasChanges) {
      logger.info(`Data changes detected: ${changes.summary}`)
      
      // Notify admins via email
      const admins = await prisma.user.findMany({
        where: {
          roles: {
            has: "admin",
          },
        },
        select: {
          email: true,
          profile: true,
        },
      })
      
      for (const admin of admins) {
        const profile = (admin.profile as any) || {}
        const preferences = profile.notificationPreferences || {}
        
        if (preferences.email !== false) {
          await sendAdminNotificationEmail({
            to: admin.email,
            subject: "Data Changes Detected",
            changes: changes.summary,
          }).catch((error) => {
            logger.error(`Failed to send notification to ${admin.email}`, error)
          })
        }
      }
    }
  } catch (error) {
    logger.error("Error in data changes check task", error)
    throw error
  }
}

/**
 * Task: Detect and report duplicate data
 */
async function detectDuplicatesTask() {
  logger.info("Running duplicate detection task")
  
  try {
    const [duplicateInstitutions, duplicatePrograms] = await Promise.all([
      detectDuplicateInstitutions(),
      detectDuplicatePrograms(),
    ])
    
    if (duplicateInstitutions.length > 0 || duplicatePrograms.length > 0) {
      logger.warn(`Found ${duplicateInstitutions.length} duplicate institutions and ${duplicatePrograms.length} duplicate programs`)
      
      // Store duplicates in database for admin review
      // This could be stored in a separate table or as part of data quality issues
    }
  } catch (error) {
    logger.error("Error in duplicate detection task", error)
    throw error
  }
}

/**
 * Task: Update data quality scores
 */
async function updateDataQualityScoresTask() {
  logger.info("Running data quality score update task")
  
  try {
    // Update institution quality scores
    const institutions = await prisma.institution.findMany({
      select: {
        id: true,
        name: true,
        website: true,
        contact: true,
        accreditationStatus: true,
        courses: true,
      },
    })
    
    for (const institution of institutions) {
      const score = calculateInstitutionQualityScore(institution)
      await prisma.institution.update({
        where: { id: institution.id },
        data: { dataQualityScore: score },
      })
    }
    
    // Update program quality scores
    const programs = await prisma.program.findMany({
      select: {
        id: true,
        description: true,
        cutoffHistory: true,
        tuitionFees: true,
        accreditationStatus: true,
      },
    })
    
    for (const program of programs) {
      const score = calculateProgramQualityScore(program)
      await prisma.program.update({
        where: { id: program.id },
        data: { dataQualityScore: score },
      })
    }
    
    logger.info("Data quality scores updated")
  } catch (error) {
    logger.error("Error in data quality score update task", error)
    throw error
  }
}

/**
 * Calculate institution quality score
 */
function calculateInstitutionQualityScore(institution: any): number {
  let score = 0
  
  if (institution.website) score += 20
  if (institution.contact) score += 20
  if (institution.accreditationStatus) score += 20
  if (institution.courses && Array.isArray(institution.courses) && institution.courses.length > 0) {
    score += 40
  }
  
  return Math.min(score, 100)
}

/**
 * Calculate program quality score
 */
function calculateProgramQualityScore(program: any): number {
  let score = 0
  
  if (program.description) score += 30
  if (program.cutoffHistory && Array.isArray(program.cutoffHistory) && program.cutoffHistory.length > 0) {
    score += 30
  }
  if (program.tuitionFees) score += 20
  if (program.accreditationStatus) score += 20
  
  return Math.min(score, 100)
}

/**
 * Initialize all scheduled tasks
 */
export function initializeScheduledTasks() {
  const tasks: ScheduledTask[] = [
    {
      id: "data-changes-check",
      name: "Data Changes Check",
      schedule: "daily", // Run daily
      handler: checkDataChangesTask,
      enabled: process.env.ENABLE_DATA_CHANGES_CHECK === "true",
    },
    {
      id: "duplicate-detection",
      name: "Duplicate Detection",
      schedule: "weekly", // Run weekly
      handler: detectDuplicatesTask,
      enabled: process.env.ENABLE_DUPLICATE_DETECTION === "true",
    },
    {
      id: "data-quality-update",
      name: "Data Quality Score Update",
      schedule: "daily", // Run daily
      handler: updateDataQualityScoresTask,
      enabled: process.env.ENABLE_DATA_QUALITY_UPDATE === "true",
    },
  ]
  
  // Register all tasks
  tasks.forEach((task) => {
    cronScheduler.register(task)
  })
  
  logger.info(`Initialized ${tasks.length} scheduled tasks`)
}

