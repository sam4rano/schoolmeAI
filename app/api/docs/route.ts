import { NextResponse } from "next/server"
import { swaggerSpec } from "@/lib/api-docs"

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI/Swagger specification
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  try {
    return NextResponse.json(swaggerSpec)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate API documentation" },
      { status: 500 }
    )
  }
}

