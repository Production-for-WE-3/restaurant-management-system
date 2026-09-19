import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "../client"
import { queryKeys } from "../query-keys"

export interface OperatingHoursStatus {
  enabled: boolean
  isOpen: boolean
  openingTime: string | null
  closingTime: string | null
  timezone: string
  nextOpeningAt: string | null
  nextClosingAt: string | null
}

export interface OperatingHoursConfig extends OperatingHoursStatus {}

export function useOperatingHours(outletId?: number | null) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.operatingHours.status(outletId),
    queryFn: () => apiClient<OperatingHoursStatus>(`/outlets/${outletId}/operating-hours`),
    enabled: outletId !== null && outletId !== undefined,
  })

  // There's no realtime push for this (isOpen only ever flips at a known,
  // precomputed boundary, not from another client's action) — instead of
  // polling on an interval "just in case", schedule exactly one refetch for
  // the moment the next open/close boundary actually arrives.
  const nextBoundary = query.data?.nextOpeningAt ?? query.data?.nextClosingAt ?? null
  useEffect(() => {
    if (!nextBoundary || outletId === null || outletId === undefined) return
    const key = queryKeys.operatingHours.status(outletId)
    const delay = new Date(nextBoundary).getTime() - Date.now()
    if (delay <= 0) {
      queryClient.invalidateQueries({ queryKey: key })
      return
    }
    const timer = setTimeout(() => queryClient.invalidateQueries({ queryKey: key }), delay)
    return () => clearTimeout(timer)
  }, [nextBoundary, outletId, queryClient])

  return query
}

export function useUpdateOperatingHours(outletId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { openingTime?: string; closingTime?: string; timezone?: string; enabled?: boolean }) =>
      apiClient<OperatingHoursStatus>(`/outlets/${outletId}/operating-hours`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operatingHours.status(outletId) }),
  })
}
