/**
 * Cron Jobs Initialization
 * Initialize scheduled tasks on application startup
 */

import { initializeScheduledTasks } from "./tasks"
import { logger } from "@/lib/utils/logger"

/**
 * Initialize cron jobs
 * Call this on application startup
 */
export function initializeCronJobs() {
  try {
    initializeScheduledTasks()
    logger.info("Cron jobs initialized successfully")
  } catch (error) {
    logger.error("Failed to initialize cron jobs", error)
  }
}

// Export scheduler for API access
export { cronScheduler } from "./scheduler"
export * from "./tasks"
export * from "./data-validation"

