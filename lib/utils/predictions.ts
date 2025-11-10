/**
 * Predictive analytics utilities for admission cutoffs
 */

interface HistoricalData {
  year: number
  cutoff: number
}

/**
 * Predict next year's cutoff based on historical trend
 * Uses linear regression for simple prediction
 */
export function predictNextCutoff(historicalData: HistoricalData[]): number | null {
  if (historicalData.length < 2) {
    return null
  }

  // Sort by year
  const sorted = [...historicalData].sort((a, b) => a.year - b.year)
  
  // Simple linear regression
  const n = sorted.length
  const sumX = sorted.reduce((sum, d) => sum + d.year, 0)
  const sumY = sorted.reduce((sum, d) => sum + d.cutoff, 0)
  const sumXY = sorted.reduce((sum, d) => sum + d.year * d.cutoff, 0)
  const sumX2 = sorted.reduce((sum, d) => sum + d.year * d.year, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Predict next year
  const lastYear = sorted[sorted.length - 1].year
  const nextYear = lastYear + 1
  const predicted = slope * nextYear + intercept

  // Round to nearest integer and ensure it's reasonable (between 0 and 400)
  return Math.max(0, Math.min(400, Math.round(predicted)))
}

/**
 * Predict multiple future years
 */
export function predictFutureCutoffs(
  historicalData: HistoricalData[],
  years: number = 3
): HistoricalData[] {
  if (historicalData.length < 2) {
    return []
  }

  const sorted = [...historicalData].sort((a, b) => a.year - b.year)
  const lastYear = sorted[sorted.length - 1].year
  
  // Calculate trend
  const n = sorted.length
  const sumX = sorted.reduce((sum, d) => sum + d.year, 0)
  const sumY = sorted.reduce((sum, d) => sum + d.cutoff, 0)
  const sumXY = sorted.reduce((sum, d) => sum + d.year * d.cutoff, 0)
  const sumX2 = sorted.reduce((sum, d) => sum + d.year * d.year, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const predictions: HistoricalData[] = []
  for (let i = 1; i <= years; i++) {
    const year = lastYear + i
    const predicted = Math.max(0, Math.min(400, Math.round(slope * year + intercept)))
    predictions.push({ year, cutoff: predicted })
  }

  return predictions
}

/**
 * Calculate trend direction (increasing, decreasing, stable)
 */
export function calculateTrend(historicalData: HistoricalData[]): {
  direction: "increasing" | "decreasing" | "stable"
  rate: number
  confidence: "high" | "medium" | "low"
} {
  if (historicalData.length < 2) {
    return { direction: "stable", rate: 0, confidence: "low" }
  }

  const sorted = [...historicalData].sort((a, b) => a.year - b.year)
  const first = sorted[0].cutoff
  const last = sorted[sorted.length - 1].cutoff
  const change = last - first
  const years = sorted.length - 1
  const rate = years > 0 ? change / years : 0

  // Determine direction
  let direction: "increasing" | "decreasing" | "stable"
  if (Math.abs(rate) < 1) {
    direction = "stable"
  } else if (rate > 0) {
    direction = "increasing"
  } else {
    direction = "decreasing"
  }

  // Calculate confidence based on data points and consistency
  const variance = sorted.reduce((sum, d, idx) => {
    if (idx === 0) return 0
    const expected = sorted[idx - 1].cutoff + rate
    return sum + Math.pow(d.cutoff - expected, 2)
  }, 0) / (sorted.length - 1)

  const stdDev = Math.sqrt(variance)
  const avgCutoff = sorted.reduce((sum, d) => sum + d.cutoff, 0) / sorted.length
  const coefficientOfVariation = stdDev / avgCutoff

  let confidence: "high" | "medium" | "low"
  if (coefficientOfVariation < 0.1 && sorted.length >= 5) {
    confidence = "high"
  } else if (coefficientOfVariation < 0.2 && sorted.length >= 3) {
    confidence = "medium"
  } else {
    confidence = "low"
  }

  return { direction, rate: Math.abs(rate), confidence }
}

/**
 * Get insights based on historical data
 */
export function getInsights(historicalData: HistoricalData[]): string[] {
  const insights: string[] = []
  
  if (historicalData.length < 2) {
    return ["Insufficient data for insights. More historical data needed."]
  }

  const trend = calculateTrend(historicalData)
  const prediction = predictNextCutoff(historicalData)
  const sorted = [...historicalData].sort((a, b) => a.year - b.year)
  const latest = sorted[sorted.length - 1]
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null

  // Trend insight
  if (trend.direction === "increasing") {
    insights.push(`Cutoff has been increasing by an average of ${trend.rate.toFixed(1)} points per year.`)
  } else if (trend.direction === "decreasing") {
    insights.push(`Cutoff has been decreasing by an average of ${trend.rate.toFixed(1)} points per year.`)
  } else {
    insights.push("Cutoff has remained relatively stable over the years.")
  }

  // Year-over-year change
  if (previous) {
    const change = latest.cutoff - previous.cutoff
    if (Math.abs(change) > 5) {
      insights.push(
        `Last year saw a ${change > 0 ? "significant increase" : "significant decrease"} of ${Math.abs(change)} points.`
      )
    }
  }

  // Prediction insight
  if (prediction !== null) {
    const change = prediction - latest.cutoff
    if (Math.abs(change) > 3) {
      insights.push(
        `Based on current trends, next year's cutoff is predicted to be ${prediction} (${change > 0 ? "+" : ""}${change} points).`
      )
    } else {
      insights.push(`Based on current trends, next year's cutoff is predicted to remain around ${prediction}.`)
    }
  }

  // Confidence insight
  if (trend.confidence === "high") {
    insights.push("High confidence in trend analysis due to consistent historical data.")
  } else if (trend.confidence === "low") {
    insights.push("Low confidence in predictions. More historical data would improve accuracy.")
  }

  return insights
}

