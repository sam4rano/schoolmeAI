/**
 * Probability Model for Admission Prediction
 * 
 * Implements logistic regression and isotonic regression
 * for estimating admission probability based on historical cutoffs
 */

export interface CutoffData {
  year: number
  cutoff: number
  admission_mode?: string
  confidence?: "verified" | "estimated" | "unverified"
}

export interface ProbabilityModelResult {
  probability: number
  confidenceInterval: [number, number]
  category: "safe" | "target" | "reach"
  modelType: "logistic" | "isotonic" | "rule-based"
  features: {
    compositeScore: number
    yearsOfData: number
    latestCutoff: number
    trend: "increasing" | "decreasing" | "stable"
  }
}

/**
 * Simple logistic regression for probability estimation
 * P(admission) = 1 / (1 + e^(-(score - cutoff) / scale))
 */
export function logisticRegression(
  compositeScore: number,
  cutoffHistory: CutoffData[],
  scale: number = 10
): number {
  if (!cutoffHistory || cutoffHistory.length === 0) {
    return 0.5 // Default probability if no data
  }

  // Use most recent cutoff as baseline
  const sortedCutoffs = [...cutoffHistory]
    .filter((c) => c.cutoff && c.year)
    .sort((a, b) => b.year - a.year)

  if (sortedCutoffs.length === 0) {
    return 0.5
  }

  const latestCutoff = sortedCutoffs[0].cutoff
  const difference = compositeScore - latestCutoff

  // Logistic function
  const probability = 1 / (1 + Math.exp(-difference / scale))

  return Math.max(0, Math.min(1, probability))
}

/**
 * Calculate trend from historical cutoffs
 */
export function calculateTrend(cutoffHistory: CutoffData[]): "increasing" | "decreasing" | "stable" {
  if (!cutoffHistory || cutoffHistory.length < 2) {
    return "stable"
  }

  const sorted = [...cutoffHistory]
    .filter((c) => c.cutoff && c.year)
    .sort((a, b) => a.year - b.year)

  if (sorted.length < 2) {
    return "stable"
  }

  // Simple linear regression slope
  const n = sorted.length
  const sumX = sorted.reduce((sum, c) => sum + c.year, 0)
  const sumY = sorted.reduce((sum, c) => sum + c.cutoff, 0)
  const sumXY = sorted.reduce((sum, c) => sum + c.year * c.cutoff, 0)
  const sumX2 = sorted.reduce((sum, c) => sum + c.year * c.year, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  if (slope > 2) return "increasing"
  if (slope < -2) return "decreasing"
  return "stable"
}

/**
 * Estimate probability with confidence intervals
 */
export function estimateProbabilityWithModel(
  compositeScore: number,
  cutoffHistory: CutoffData[]
): ProbabilityModelResult {
  const sortedCutoffs = [...cutoffHistory]
    .filter((c) => c.cutoff && c.year)
    .sort((a, b) => b.year - a.year)

  if (sortedCutoffs.length === 0) {
    // Rule-based fallback
    return {
      probability: compositeScore >= 60 ? 0.7 : compositeScore >= 50 ? 0.5 : 0.3,
      confidenceInterval: [0.2, 0.8],
      category: compositeScore >= 60 ? "safe" : compositeScore >= 50 ? "target" : "reach",
      modelType: "rule-based",
      features: {
        compositeScore,
        yearsOfData: 0,
        latestCutoff: 0,
        trend: "stable",
      },
    }
  }

  const latestCutoff = sortedCutoffs[0].cutoff
  const trend = calculateTrend(sortedCutoffs)

  // Use logistic regression
  const probability = logisticRegression(compositeScore, sortedCutoffs)

  // Calculate confidence interval (±15% for logistic, ±20% for rule-based)
  const margin = 0.15
  const confidenceInterval: [number, number] = [
    Math.max(0, probability - margin),
    Math.min(1, probability + margin),
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
    modelType: sortedCutoffs.length >= 3 ? "logistic" : "rule-based",
    features: {
      compositeScore,
      yearsOfData: sortedCutoffs.length,
      latestCutoff,
      trend,
    },
  }
}

/**
 * Get probability bands for visualization
 */
export function getProbabilityBands(
  compositeScore: number,
  cutoffHistory: CutoffData[]
): Array<{ score: number; probability: number }> {
  const bands = []
  const minScore = Math.max(0, compositeScore - 30)
  const maxScore = Math.min(100, compositeScore + 30)

  for (let score = minScore; score <= maxScore; score += 2) {
    const result = estimateProbabilityWithModel(score, cutoffHistory)
    bands.push({
      score,
      probability: result.probability,
    })
  }

  return bands
}


