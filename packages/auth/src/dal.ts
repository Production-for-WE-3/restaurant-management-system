import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { backendFetch, BackendUnauthorizedError } from "./server/backend-client"

export interface CurrentUser {
  id: number
  name: string
  email: string
  /** Hotel/company this user belongs to; null means superadmin/global. */
  tenantId: number | null
  isSuperadmin: boolean
  permissions: string[]
  /** Slugs of every active position linked to this user. */
  positionSlugs: string[]
  /** Which app this user lands in after login. Legacy values may still appear as "operational" until the backend data is cleaned up. */
  portal: "dashboard" | "staff" | "operational"
  /** Whether the user can reach both the dashboard and staff apps — drives the header portal switcher. */
  hasBothPortals: boolean
  /** Outlets this user's active employee assignments provide access to. */
  outletIds: number[]
  /** Outlet-departments this user's active employee assignments provide access to. */
  departmentIds: number[]
}

/**
 * The real (non-optimistic) auth check: calls the backend's /auth/me, which
 * validates the JWT server-side. Memoized per request via React's cache().
 * Redirects to /login if there's no valid session — proxy.ts only does a
 * cheap cookie-presence check, this is the actual gate.
 */
export const verifySession = cache(async (): Promise<CurrentUser> => {
  try {
    const response = await backendFetch("/auth/me")
    if (!response.ok) {
      redirect("/api/auth/clear-session")
    }
    return (await response.json()) as CurrentUser
  } catch (error) {
    if (error instanceof BackendUnauthorizedError) {
      redirect("/api/auth/clear-session")
    }
    throw error
  }
})

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  return verifySession()
})
