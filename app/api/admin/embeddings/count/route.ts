import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/middleware/admin"
import { handleApiError } from "@/lib/utils/api-error-handler"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const count = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM embeddings`
    )

    return NextResponse.json({
      count: Number(count[0]?.count || 0),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

