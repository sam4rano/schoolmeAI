/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 * Used to initialize cron jobs and other server-side services
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Only run on Node.js runtime (server-side)
    const { initializeCronJobs } = await import("@/lib/cron")
    
    try {
      initializeCronJobs()
      console.log("✅ Cron jobs initialized")
    } catch (error) {
      console.error("❌ Failed to initialize cron jobs:", error)
    }
  }
}

