"use client"

import { useQuery } from "@tanstack/react-query"

interface RecommendationParams {
  utme: number
  olevels: Record<string, string>
  stateOfOrigin?: string
  postUtme?: number
  limit?: number
}

interface ProgramWithEligibility {
  id: string
  name: string
  institution: {
    id: string
    name: string
    type: string
    ownership: string
    state: string
  }
  degreeType?: string
  duration?: string
  cutoffHistory?: any[]
  eligibility: {
    probability: number
    category: "safe" | "target" | "reach"
    compositeScore: number
    confidenceInterval?: [number, number]
  }
}

interface RecommendationsResponse {
  data: ProgramWithEligibility[]
  meta: {
    compositeScore: number
    totalPrograms: number
    recommended: number
  }
}

export function useRecommendations(params?: RecommendationParams) {
  return useQuery<RecommendationsResponse>({
    queryKey: [
      "recommendations",
      params?.utme,
      params?.olevels ? JSON.stringify(params.olevels) : undefined,
      params?.stateOfOrigin,
      params?.postUtme,
      params?.limit,
    ],
    queryFn: async () => {
      if (!params) {
        throw new Error("Recommendation parameters required")
      }

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch recommendations")
      }

      return response.json()
    },
    enabled: !!params && !!params.utme && Object.keys(params.olevels).length > 0,
  })
}

