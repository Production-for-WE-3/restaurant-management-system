import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"

export interface OrganizationAsset {
  id: number
  serialNo: string
  name: string
  quantity: number
  rate: number
  total: number
  createdAt: string
  updatedAt: string
}

export interface CreateAssetItemInput {
  serialNo: string
  name: string
  quantity: number
  rate: number
}

export function useAssets() {
  return useQuery({ queryKey: ["organization-assets"], queryFn: () => apiClient<OrganizationAsset[]>("/assets"), staleTime: 30_000 })
}

export function useCreateAssets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: CreateAssetItemInput[]) => apiClient<OrganizationAsset[]>("/assets", { method: "POST", body: JSON.stringify({ items }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-assets"] }),
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient<void>(`/assets/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization-assets"] }),
  })
}
