import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/utils/logger"
import { HTTP_STATUS } from "@/lib/constants"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Verify the calculation belongs to the user
    const calculation = await (prisma as any).calculation.findUnique({
      where: { id: params.id },
    })

    if (!calculation) {
      return NextResponse.json(
        { error: "Calculation not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    if (calculation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    await (prisma as any).calculation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Calculation deleted" })
  } catch (error) {
    logger.error("Error deleting calculation", error, {
      endpoint: `/api/calculations/${params.id}`,
      method: "DELETE",
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}

