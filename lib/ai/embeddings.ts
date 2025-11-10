import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import type { Vector } from "@/lib/types/vector"

interface EmbeddingData {
  entityType: string
  entityId: string
  content: string
  metadata?: Record<string, any>
}

/**
 * Generate embedding using OpenAI API
 * Falls back to local embedding if OPENAI_API_KEY is not set
 */
export async function generateEmbedding(text: string): Promise<Vector<1536>> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set, using fallback embedding")
    return generateFallbackEmbedding(text)
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    return generateFallbackEmbedding(text)
  }
}

/**
 * Fallback embedding generator (simple hash-based)
 * For production, consider using a local model like sentence-transformers
 */
function generateFallbackEmbedding(text: string): Vector<1536> {
  const hash = crypto.createHash("sha256").update(text).digest("hex")
  const embedding = new Array(1536).fill(0)

  for (let i = 0; i < hash.length && i < embedding.length; i++) {
    embedding[i] = (parseInt(hash[i], 16) / 15) * 2 - 1
  }

  return embedding
}

/**
 * Store embedding in database
 */
export async function storeEmbedding(data: EmbeddingData, embedding: Vector<1536>): Promise<void> {
  const contentHash = crypto.createHash("sha256").update(data.content).digest("hex")
  const embeddingVector = `[${embedding.join(",")}]`
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null

  // Use raw SQL since Prisma doesn't support vector type natively
  // Try snake_case first (from migration), fallback to camelCase if needed
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO embeddings (id, entity_type, entity_id, content, content_hash, embedding, metadata, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        $3,
        $4,
        $5::vector,
        $6::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (entity_type, entity_id, content_hash) 
      DO UPDATE SET
        embedding = EXCLUDED.embedding,
        updated_at = NOW()
    `, data.entityType, data.entityId, data.content, contentHash, embeddingVector, metadataJson)
  } catch (error) {
    // Fallback to camelCase if snake_case doesn't work
    if (error instanceof Error && error.message.includes("does not exist")) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO embeddings (id, "entityType", "entityId", content, "contentHash", embedding, metadata, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          $1,
          $2,
          $3,
          $4,
          $5::vector,
          $6::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT ("entityType", "entityId", "contentHash") 
        DO UPDATE SET
          embedding = EXCLUDED.embedding,
          "updatedAt" = NOW()
      `, data.entityType, data.entityId, data.content, contentHash, embeddingVector, metadataJson)
    } else {
      throw error
    }
  }
}

/**
 * Find similar embeddings using cosine similarity
 */
export async function findSimilarEmbeddings(
  queryEmbedding: Vector<1536>,
  entityType?: string,
  limit: number = 5
): Promise<Array<{ id: string; entityType: string; entityId: string; content: string; metadata: any; similarity: number }>> {
  try {
    const embeddingVector = `[${queryEmbedding.join(",")}]`

    let query = `
      SELECT 
        id,
        entity_type as "entityType",
        entity_id as "entityId",
        content,
        metadata,
        1 - (embedding <=> $1::vector) as similarity
      FROM embeddings
      WHERE 1 - (embedding <=> $1::vector) > 0.3
    `

    const params: any[] = [embeddingVector]

    if (entityType) {
      query += ` AND entity_type = $2`
      params.push(entityType)
    }

    query += ` ORDER BY similarity DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const results = await prisma.$queryRawUnsafe(query, ...params)

    return results as Array<{
      id: string
      entityType: string
      entityId: string
      content: string
      metadata: any
      similarity: number
    }>
  } catch (error) {
    console.error("Error in findSimilarEmbeddings:", error)
    // If embeddings table doesn't exist, return empty array
    if (error instanceof Error && (error.message.includes("relation") || error.message.includes("does not exist"))) {
      console.warn("Embeddings table not found, returning empty results")
      return []
    }
    throw error
  }
}

/**
 * Generate and store embedding for an entity
 */
export async function createEmbedding(data: EmbeddingData): Promise<void> {
  const embedding = await generateEmbedding(data.content)
  await storeEmbedding(data, embedding)
}

