export interface RoutePermissionEntry {
  href: string
  permission: string | true
}

export interface PermissionCheckable {
  permissions: string[]
}

/** Canonical permission predicate for all frontend visibility/action checks. */
export function hasPermission(user: PermissionCheckable, permission: string | true | null | undefined): boolean {
  return permission === undefined || permission === null || permission === true || user.permissions.includes(permission)
}

/**
 * Finds the route-access entry that applies to a pathname by matching against
 * a table of {href, permission} entries (exact match or href as a path
 * prefix), picking the most specific (longest) href. Returns undefined when
 * nothing requires gating the route.
 */
export function findRequiredPermission(
  pathname: string,
  entries: RoutePermissionEntry[],
): RoutePermissionEntry | undefined {
  let best: RoutePermissionEntry | undefined
  for (const entry of entries) {
    const matches = pathname === entry.href || pathname.startsWith(`${entry.href}/`)
    if (matches && (!best || entry.href.length > best.href.length)) {
      best = entry
    }
  }
  return best
}

/**
 * Accepts either a raw permission requirement (`string | true | undefined`,
 * as used by ad-hoc in-component checks like `hasRoutePermission(user,
 * "food-variants.view")`) or a full `RoutePermissionEntry` (as returned by
 * `findRequiredPermission`) without every caller having to unwrap it
 * themselves.
 */
export function hasRoutePermission(
  user: PermissionCheckable,
  requirement: string | true | RoutePermissionEntry | null | undefined,
): boolean {
  if (requirement !== undefined && requirement !== null && typeof requirement === "object") {
    return hasRoutePermission(user, requirement.permission)
  }
  return hasPermission(user, requirement)
}

export interface PortalCheckable {
  /**
   * Which app the backend resolved this user into, aggregated server-side
   * (see PermissionsService#getPortalAccess) from the explicit `portal` field
   * on each of the user's active role assignments. Legacy values may still
   * come through as "operational" until the DB is fully normalized.
   */
  portal: "dashboard" | "staff" | "operational"
  /** Whether the user can reach both apps. When true, the default landing
   * should still be the dashboard shell; the operational app remains a valid
   * override only for explicit app navigation or when the user has no dashboard
   * access at all.
   */
  hasBothPortals?: boolean
}

/** Where "/" should land a signed-in user. */
export function getLandingPath(user: PortalCheckable): "/dashboard" | "/staff" {
  const normalizedPortal = user.portal === "operational" ? "staff" : user.portal
  if (normalizedPortal === "dashboard" || user.hasBothPortals) {
    return "/dashboard"
  }
  return "/staff"
}
