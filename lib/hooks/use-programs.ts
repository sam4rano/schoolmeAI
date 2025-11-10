"use client"

import { useQuery } from "@tanstack/react-query"

interface Program {
  id: string
  name: string
  institution: {
    id: string
    name: string
    type: string
    ownership: string
    state: string
  }
  faculty?: string
  department?: string
  degreeType?: string
  cutoffHistory?: any[]
}

interface ProgramsResponse {
  data: Program[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function usePrograms(params?: {
  query?: string
  course?: string
  institution_id?: string
  institution_type?: string
  degreeType?: string
  accreditationStatus?: string
  cutoffMin?: string
  cutoffMax?: string
  feesMin?: string
  feesMax?: string
  page?: number
  limit?: number
  rankByDifficulty?: boolean
}) {
  return useQuery<ProgramsResponse>({
    queryKey: [
      "programs",
      params?.query,
      params?.course,
      params?.institution_id,
      params?.institution_type,
      params?.degreeType,
      params?.accreditationStatus,
      params?.cutoffMin,
      params?.cutoffMax,
      params?.feesMin,
      params?.feesMax,
      params?.page,
      params?.limit,
      params?.rankByDifficulty,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.query) searchParams.set("query", params.query)
      if (params?.course) searchParams.set("course", params.course)
      if (params?.institution_id) searchParams.set("institution_id", params.institution_id)
      if (params?.institution_type) searchParams.set("institution_type", params.institution_type)
      if (params?.degreeType) searchParams.set("degreeType", params.degreeType)
      if (params?.accreditationStatus) searchParams.set("accreditationStatus", params.accreditationStatus)
      if (params?.cutoffMin) searchParams.set("cutoffMin", params.cutoffMin)
      if (params?.cutoffMax) searchParams.set("cutoffMax", params.cutoffMax)
      if (params?.feesMin) searchParams.set("feesMin", params.feesMin)
      if (params?.feesMax) searchParams.set("feesMax", params.feesMax)
      if (params?.page) searchParams.set("page", params.page.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      if (params?.rankByDifficulty) searchParams.set("rankByDifficulty", "true")

      const response = await fetch(`/api/programs?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch programs")
      return response.json()
    },
  })
}

export function useProgram(id: string) {
  return useQuery<{ data: Program }>({
    queryKey: ["program", id],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${id}`)
      if (!response.ok) throw new Error("Failed to fetch program")
      return response.json()
    },
    enabled: !!id,
  })
}


