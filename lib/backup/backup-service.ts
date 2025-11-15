/**
 * Automated Backup Service
 * Handles database backups, scheduling, and restoration
 */

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs/promises"
import * as path from "path"

const execAsync = promisify(exec)

export interface BackupOptions {
  format?: "sql" | "csv"
  includeData?: boolean
  compress?: boolean
}

export interface BackupResult {
  success: boolean
  filePath?: string
  size?: number
  error?: string
  timestamp: Date
}

/**
 * Create a database backup
 */
export async function createBackup(options: BackupOptions = {}): Promise<BackupResult> {
  const {
    format = "sql",
    includeData = true,
    compress = true,
  } = options
  
  const timestamp = new Date()
  const timestampStr = timestamp.toISOString().replace(/[:.]/g, "-")
  const backupDir = path.join(process.cwd(), "backups")
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true })
    
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured")
    }
    
    // Parse database URL
    const url = new URL(dbUrl)
    const dbName = url.pathname.slice(1)
    const dbHost = url.hostname
    const dbPort = url.port || "5432"
    const dbUser = url.username
    const dbPassword = url.password
    
    let filePath: string
    let command: string
    
    if (format === "sql") {
      // PostgreSQL dump
      filePath = path.join(backupDir, `backup-${timestampStr}.sql`)
      
      // Use pg_dump
      const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${filePath}"`
      
      command = pgDumpCommand
    } else {
      // CSV export (simplified - would need to export each table)
      filePath = path.join(backupDir, `backup-${timestampStr}.csv`)
      // For CSV, we'll use a script approach
      throw new Error("CSV backup format not yet implemented")
    }
    
    // Execute backup command
    await execAsync(command)
    
    // Compress if requested
    if (compress && format === "sql") {
      const compressedPath = `${filePath}.gz`
      await execAsync(`gzip "${filePath}"`)
      filePath = compressedPath
    }
    
    // Get file size
    const stats = await fs.stat(filePath)
    const size = stats.size
    
    logger.info(`Backup created: ${filePath} (${size} bytes)`)
    
    return {
      success: true,
      filePath,
      size,
      timestamp,
    }
  } catch (error: any) {
    logger.error("Backup failed", error)
    return {
      success: false,
      error: error.message || "Unknown error",
      timestamp,
    }
  }
}

/**
 * Restore from backup
 */
export async function restoreBackup(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured")
    }
    
    // Parse database URL
    const url = new URL(dbUrl)
    const dbName = url.pathname.slice(1)
    const dbHost = url.hostname
    const dbPort = url.port || "5432"
    const dbUser = url.username
    const dbPassword = url.password
    
    // Check if file is compressed
    const isCompressed = filePath.endsWith(".gz")
    let restorePath = filePath
    
    if (isCompressed) {
      // Decompress
      restorePath = filePath.replace(".gz", "")
      await execAsync(`gunzip -c "${filePath}" > "${restorePath}"`)
    }
    
    // Restore using pg_restore or psql
    if (filePath.endsWith(".sql")) {
      const command = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${restorePath}"`
      await execAsync(command)
    } else {
      // Handle custom format
      const command = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} "${restorePath}"`
      await execAsync(command)
    }
    
    // Clean up decompressed file if needed
    if (isCompressed && restorePath !== filePath) {
      await fs.unlink(restorePath)
    }
    
    logger.info(`Backup restored from: ${filePath}`)
    
    return { success: true }
  } catch (error: any) {
    logger.error("Restore failed", error)
    return {
      success: false,
      error: error.message || "Unknown error",
    }
  }
}

/**
 * List available backups
 */
export async function listBackups(): Promise<Array<{ filePath: string; size: number; timestamp: Date }>> {
  const backupDir = path.join(process.cwd(), "backups")
  
  try {
    const files = await fs.readdir(backupDir)
    const backups = []
    
    for (const file of files) {
      if (file.startsWith("backup-") && (file.endsWith(".sql") || file.endsWith(".sql.gz"))) {
        const filePath = path.join(backupDir, file)
        const stats = await fs.stat(filePath)
        
        // Extract timestamp from filename
        const timestampMatch = file.match(/backup-(.+)\.sql/)
        const timestamp = timestampMatch
          ? new Date(timestampMatch[1].replace(/-/g, ":").replace("T", "T").replace("Z", "Z"))
          : stats.mtime
        
        backups.push({
          filePath,
          size: stats.size,
          timestamp,
        })
      }
    }
    
    // Sort by timestamp (newest first)
    backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return backups
  } catch (error) {
    logger.error("Failed to list backups", error)
    return []
  }
}

/**
 * Delete old backups (keep only the last N backups)
 */
export async function cleanupOldBackups(keepCount: number = 10): Promise<number> {
  const backups = await listBackups()
  
  if (backups.length <= keepCount) {
    return 0
  }
  
  const toDelete = backups.slice(keepCount)
  let deleted = 0
  
  for (const backup of toDelete) {
    try {
      await fs.unlink(backup.filePath)
      deleted++
    } catch (error) {
      logger.error(`Failed to delete backup ${backup.filePath}`, error)
    }
  }
  
  logger.info(`Cleaned up ${deleted} old backups`)
  return deleted
}

