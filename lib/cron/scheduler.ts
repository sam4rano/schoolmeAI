/**
 * Cron Job Scheduler
 * Handles scheduled tasks for automated data updates
 */

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"

export interface ScheduledTask {
  id: string
  name: string
  schedule: string // Cron expression
  handler: () => Promise<void>
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
}

class CronScheduler {
  private tasks: Map<string, ScheduledTask> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Register a scheduled task
   */
  register(task: ScheduledTask) {
    this.tasks.set(task.id, task)
    if (task.enabled) {
      this.scheduleTask(task)
    }
  }

  /**
   * Schedule a task based on cron expression
   * Note: This is a simplified cron parser. For production, use a library like node-cron
   */
  private scheduleTask(task: ScheduledTask) {
    // Clear existing interval if any
    if (this.intervals.has(task.id)) {
      clearInterval(this.intervals.get(task.id)!)
    }

    // Parse cron expression (simplified: supports "daily", "weekly", "hourly", or cron format)
    const interval = this.parseCronExpression(task.schedule)
    
    if (interval > 0) {
      const intervalId = setInterval(async () => {
        try {
          await this.executeTask(task)
        } catch (error) {
          logger.error(`Error executing scheduled task ${task.id}`, error)
        }
      }, interval)
      
      this.intervals.set(task.id, intervalId)
      
      // Execute immediately if it's the first run
      this.executeTask(task).catch((error) => {
        logger.error(`Error executing initial task ${task.id}`, error)
      })
    }
  }

  /**
   * Parse cron expression to milliseconds
   * Supports: "daily", "weekly", "hourly", or cron format (simplified)
   */
  private parseCronExpression(schedule: string): number {
    const lower = schedule.toLowerCase()
    
    if (lower === "daily" || lower === "0 0 * * *") {
      return 24 * 60 * 60 * 1000 // 24 hours
    }
    if (lower === "weekly" || lower === "0 0 * * 0") {
      return 7 * 24 * 60 * 60 * 1000 // 7 days
    }
    if (lower === "hourly" || lower === "0 * * * *") {
      return 60 * 60 * 1000 // 1 hour
    }
    
    // For now, default to daily for any other format
    // In production, use a proper cron parser library
    return 24 * 60 * 60 * 1000
  }

  /**
   * Execute a task
   */
  private async executeTask(task: ScheduledTask) {
    const startTime = Date.now()
    logger.info(`Executing scheduled task: ${task.name} (${task.id})`)
    
    try {
      await task.handler()
      
      const duration = Date.now() - startTime
      logger.info(`Scheduled task ${task.name} completed in ${duration}ms`)
      
      // Update last run time
      task.lastRun = new Date()
      task.nextRun = this.calculateNextRun(task.schedule)
      
    } catch (error) {
      logger.error(`Scheduled task ${task.name} failed`, error)
      throw error
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(schedule: string): Date {
    const interval = this.parseCronExpression(schedule)
    return new Date(Date.now() + interval)
  }

  /**
   * Enable a task
   */
  enable(taskId: string) {
    const task = this.tasks.get(taskId)
    if (task) {
      task.enabled = true
      this.scheduleTask(task)
    }
  }

  /**
   * Disable a task
   */
  disable(taskId: string) {
    const task = this.tasks.get(taskId)
    if (task) {
      task.enabled = false
      if (this.intervals.has(taskId)) {
        clearInterval(this.intervals.get(taskId)!)
        this.intervals.delete(taskId)
      }
    }
  }

  /**
   * Get all tasks
   */
  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId)
  }
}

// Singleton instance
export const cronScheduler = new CronScheduler()

