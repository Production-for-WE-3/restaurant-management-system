import { useQuery } from "@tanstack/react-query"
import { apiClient } from "../client"
import { EMPTY_BRANDING, type Branding } from "../branding"

export function useBranding(): Branding {
  // Superadmin workspaces can switch tenants without changing the browser
  // origin. Keep the cache identity tenant-aware so the previous tenant's
  // logo/colour cannot remain visible after that switch.
  const tenantSlug = typeof window === "undefined"
    ? null
    : window.localStorage.getItem("active-tenant-slug")
  const query = useQuery({
    queryKey: ["branding", tenantSlug],
    queryFn: () => apiClient<Branding>("/settings/branding/public"),
    staleTime: 30 * 1000,
  })

  return query.data ?? EMPTY_BRANDING
}
