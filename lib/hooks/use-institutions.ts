"use client"

import { useQuery } from "@tanstack/react-query"

interface Institution {
  id: string
  name: string
  type: string
  ownership: string
  state: string
  city: string
  website?: string
}

interface InstitutionsResponse {
  data: Institution[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useInstitutions(params?: {
  query?: string
  type?: string
  ownership?: string
  state?: string
  page?: number
  limit?: number
}) {
  return useQuery<InstitutionsResponse>({
    queryKey: [
      "institutions",
      params?.query,
      params?.type,
      params?.ownership,
      params?.state,
      params?.page,
      params?.limit,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.query) searchParams.set("query", params.query)
      if (params?.type) searchParams.set("type", params.type)
      if (params?.ownership) searchParams.set("ownership", params.ownership)
      if (params?.state) searchParams.set("state", params.state)
      if (params?.page) searchParams.set("page", params.page.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())

      const response = await fetch(`/api/institutions?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch institutions")
      return response.json()
    },
  })
}

export function useInstitution(id: string) {
  return useQuery<{ data: Institution }>({
    queryKey: ["institution", id],
    queryFn: async () => {
      const response = await fetch(`/api/institutions/${id}`)
      if (!response.ok) throw new Error("Failed to fetch institution")
      return response.json()
    },
    enabled: !!id,
  })
}

