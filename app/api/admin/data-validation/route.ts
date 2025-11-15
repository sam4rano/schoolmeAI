/**
 * Admin API for data validation and quality checks
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/middleware/admin"
import {
  detectDuplicateInstitutions,
  detectDuplicatePrograms,
  validateDataConsistency,
  cleanupData,
} from "@/lib/cron/data-validation"
import { handleApiError } from "@/lib/utils/api-error-handler"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    
    if (action === "duplicates") {
      const [institutions, programs] = await Promise.all([
        detectDuplicateInstitutions(),
        detectDuplicatePrograms(),
      ])
      
      return NextResponse.json({
        data: {
          duplicateInstitutions: institutions,
          duplicatePrograms: programs,
        },
      })
    } else if (action === "consistency") {
      const result = await validateDataConsistency()
      return NextResponse.json({ data: result })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { action } = body
    
    if (action === "cleanup") {
      const result = await cleanupData()
      return NextResponse.json({ data: result })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

