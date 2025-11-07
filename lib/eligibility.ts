import { z } from "zod"

// O-level grade to points mapping (default)
const DEFAULT_GRADE_POINTS: Record<string, number> = {
  A1: 6,
  B2: 5,
  B3: 4,
  C4: 3,
  C5: 2,
  C6: 1,
  D7: 0,
  E8: 0,
  F9: 0,
}

// O-level grade validation schema
const gradeSchema = z.enum(["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"])

export interface EligibilityInput {
  utme: number // 0-400
  olevels: Record<string, string> // {subject: grade}
  programId: string
  stateOfOrigin?: string
}

export interface EligibilityResult {
  compositeScore: number
  probability?: number
  confidenceInterval?: [number, number]
  category: "safe" | "target" | "reach"
  rationale: string
  dataQuality: {
    cutoffConfidence: "verified" | "estimated" | "unverified"
    historicalDataYears?: number
    lastUpdated?: string
  }
  modelType?: "logistic" | "isotonic" | "rule-based"
  features?: {
    compositeScore: number
    yearsOfData: number
    latestCutoff: number
    trend: "increasing" | "decreasing" | "stable"
  }
}

/**
 * Convert O-level grades to points
 */
export function convertGradesToPoints(
  grades: Record<string, string>,
  gradeMapping: Record<string, number> = DEFAULT_GRADE_POINTS
): number {
  let totalPoints = 0
  let subjectCount = 0

  for (const [subject, grade] of Object.entries(grades)) {
    const normalizedGrade = grade.toUpperCase()
    if (gradeSchema.safeParse(normalizedGrade).success) {
      const points = gradeMapping[normalizedGrade] || 0
      totalPoints += points
      subjectCount++
    }
  }

  // Calculate average points per subject, then scale to 100
  const averagePoints = subjectCount > 0 ? totalPoints / subjectCount : 0
  const maxPoints = 6 // A1 grade
  const scaledPoints = (averagePoints / maxPoints) * 100

  return Math.round(scaledPoints * 100) / 100
}

/**
 * Calculate composite score
 * Formula: composite = alpha * UTME + beta * Olevel_points + gamma * PostUTME
 */
export function calculateCompositeScore(
  utme: number,
  olevelPoints: number,
  postUtme?: number,
  alpha: number = 0.6,
  beta: number = 0.4,
  gamma: number = 0
): number {
  let composite = alpha * utme + beta * olevelPoints

  if (postUtme && gamma > 0) {
    composite += gamma * postUtme
  }

  return Math.round(composite * 100) / 100
}

/**
 * Estimate admission probability based on historical cutoffs
 */
export function estimateProbability(
  compositeScore: number,
  cutoffHistory: any[],
  currentYear: number = new Date().getFullYear()
): {
  probability?: number
  confidenceInterval?: [number, number]
  category: "safe" | "target" | "reach"
} {
  if (!cutoffHistory || cutoffHistory.length === 0) {
    // Fallback: rule-based estimation
    return {
      category: compositeScore >= 60 ? "safe" : compositeScore >= 50 ? "target" : "reach",
    }
  }

  // Sort cutoff history by year (most recent first)
  const sortedCutoffs = [...cutoffHistory]
    .filter((cutoff) => cutoff.year && cutoff.cutoff)
    .sort((a, b) => b.year - a.year)

  if (sortedCutoffs.length === 0) {
    return {
      category: compositeScore >= 60 ? "safe" : compositeScore >= 50 ? "target" : "reach",
    }
  }

  // Get most recent cutoff
  const latestCutoff = sortedCutoffs[0]
  const latestCutoffValue = latestCutoff.cutoff

  // Calculate difference from latest cutoff
  const difference = compositeScore - latestCutoffValue

  // Simple probability estimation based on difference
  let probability = 0.5 // Base probability
  if (difference > 10) {
    probability = 0.85 // High probability
  } else if (difference > 5) {
    probability = 0.7 // Medium-high
  } else if (difference > 0) {
    probability = 0.6 // Medium
  } else if (difference > -5) {
    probability = 0.4 // Medium-low
  } else {
    probability = 0.2 // Low
  }

  // Calculate confidence interval (±10%)
  const confidenceInterval: [number, number] = [
    Math.max(0, probability - 0.1),
    Math.min(1, probability + 0.1),
  ]

  // Determine category
  let category: "safe" | "target" | "reach"
  if (probability >= 0.7) {
    category = "safe"
  } else if (probability >= 0.5) {
    category = "target"
  } else {
    category = "reach"
  }

  return {
    probability: Math.round(probability * 100) / 100,
    confidenceInterval,
    category,
  }
}

/**
 * Generate rationale for eligibility result
 */
export function generateRationale(
  compositeScore: number,
  utme: number,
  olevelPoints: number,
  programName: string,
  institutionName: string,
  cutoffHistory: any[],
  probability?: number,
  category?: "safe" | "target" | "reach"
): string {
  const latestCutoff = cutoffHistory?.[0]?.cutoff

  let rationale = `Your composite score (${compositeScore}) is based on UTME score of ${utme} and O-level points of ${olevelPoints}. `

  if (latestCutoff) {
    const difference = compositeScore - latestCutoff
    if (difference > 0) {
      rationale += `This is ${Math.abs(difference).toFixed(1)} points above the ${cutoffHistory[0].year} cutoff (${latestCutoff}) for ${programName} at ${institutionName}. `
    } else {
      rationale += `This is ${Math.abs(difference).toFixed(1)} points below the ${cutoffHistory[0].year} cutoff (${latestCutoff}) for ${programName} at ${institutionName}. `
    }
  }

  if (probability !== undefined) {
    const percentage = (probability * 100).toFixed(0)
    rationale += `Based on historical data, your estimated admission probability is ${percentage}%. `
  }

  if (category) {
    const categoryText = {
      safe: "This is considered a SAFE choice",
      target: "This is considered a TARGET choice",
      reach: "This is considered a REACH choice",
    }
    rationale += categoryText[category] + "."
  }

  return rationale
}

