/**
 * Structured logging utility
 * Replaces console.log with proper logging levels
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private isProduction = process.env.NODE_ENV === "production"

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context)

    switch (level) {
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
      case "info":
        console.info(formattedMessage)
        break
      case "warn":
        console.warn(formattedMessage)
        break
      case "error":
        console.error(formattedMessage)
        // In production, send to error tracking service
        if (this.isProduction && typeof window === "undefined") {
          // TODO: Integrate with Sentry or similar
          // Sentry.captureException(new Error(message), { extra: context })
        }
        break
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    }
    this.log("error", errorMessage, errorContext)
  }
}

export const logger = new Logger()

