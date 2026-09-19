import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../client"
import { EMPTY_BRANDING, type Branding } from "../branding"

export function useBranding(): Branding {
  // Read once after mount so SSR and the initial client render agree on the
  // same key (null), then settle to the real slug if one is set. This prevents
  // the SSR null → localStorage-slug mismatch that was causing an extra render
  // cycle on first load. Superadmin-web sets active-tenant-slug to switch
  // tenants without a page reload — the key stays tenant-aware for that case.
  const [tenantSlug] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem("active-tenant-slug"),
  )
  const query = useQuery({
    queryKey: ["branding", tenantSlug],
    queryFn: () => apiClient<Branding>("/settings/branding/public"),
    staleTime: 30 * 1000,
  })

  return query.data ?? EMPTY_BRANDING
}
