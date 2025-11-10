/**
 * Vector type definitions for embeddings
 * Provides type safety for vector operations
 */

/**
 * Vector type for embeddings
 * @template D - Dimension of the vector (e.g., 1536 for OpenAI ada-002)
 */
export type Vector<D extends number = 1536> = number[]

/**
 * Type guard to check if a value is a valid vector
 */
export function isVector(value: unknown, dimension?: number): value is Vector {
  if (!Array.isArray(value)) {
    return false
  }

  if (dimension !== undefined && value.length !== dimension) {
    return false
  }

  return value.every((item) => typeof item === "number" && !isNaN(item))
}

/**
 * Validate vector dimension
 */
export function validateVectorDimension(vector: Vector, expectedDimension: number): boolean {
  return vector.length === expectedDimension
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: Vector, b: Vector): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimension")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(vector: Vector): Vector {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  if (magnitude === 0) {
    return vector
  }
  return vector.map((val) => val / magnitude)
}

