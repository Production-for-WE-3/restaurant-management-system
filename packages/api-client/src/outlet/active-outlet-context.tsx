"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { ApiError } from "../client"
import { useAssignedOutletDepartments } from "../hooks/use-outlet-departments"
import type { OutletDepartment } from "../hooks/use-outlet-departments"
import { useAssignedOutlets, type Outlet } from "../hooks/use-outlets"
import { useCurrentUser } from "@rms/auth/current-user-context"

const ACTIVE_OUTLET_STORAGE_KEY = "active-outlet-id"
const ACTIVE_DEPARTMENT_STORAGE_KEY = "active-department-id"

function readStoredId(key: string): number | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(key)
  if (!stored) return null
  const n = Number(stored)
  return Number.isFinite(n) ? n : null
}

interface ActiveOutletContextValue {
  outletId: number | null
  setOutletId: (id: number | null) => void
  outlets: Outlet[]
  isLoadingOutlets: boolean
  showOutletPicker: boolean
  departmentId: number | null
  setDepartmentId: (id: number | null) => void
  departments: OutletDepartment[]
  isLoadingDepartments: boolean
  showDepartmentPicker: boolean
}

const ActiveOutletContext = createContext<ActiveOutletContextValue | null>(null)

export function ActiveOutletProvider({ children }: { children: React.ReactNode }) {
  const { outletIds: userOutletIds } = useCurrentUser()
  const assignedOutletsQuery = useAssignedOutlets()

  const outlets = useMemo(
    () => assignedOutletsQuery.data ?? [],
    [assignedOutletsQuery.data],
  )
  const isLoadingOutlets = assignedOutletsQuery.isLoading
  const outletQueryFailed = assignedOutletsQuery.isError
  const outletQueryErrorMessage = assignedOutletsQuery.error instanceof ApiError && assignedOutletsQuery.error.status === 403
    ? "This tenant is inactive or unavailable. Ask an administrator to restore access or assign you to an active tenant."
    : "The session is valid, but the staff permissions service could not load your assigned outlets."
  const showOutletPicker = outlets.length > 1

  const [outletId, setOutletIdState] = useState<number | null>(
    () => readStoredId(ACTIVE_OUTLET_STORAGE_KEY) ?? userOutletIds[0] ?? null,
  )

  function setOutletId(id: number | null) {
    const requested = id !== null && outlets.some((o) => o.id === id) ? id : (outlets[0]?.id ?? null)
    setOutletIdState(requested)
  }

  useEffect(() => {
    if (isLoadingOutlets || outlets.length === 0) return
    const stillValid = outletId !== null && outlets.some((o) => o.id === outletId)
    if (!stillValid) setOutletIdState(outlets[0].id)
  }, [outlets, isLoadingOutlets, outletId])

  useEffect(() => {
    if (outletId !== null) {
      localStorage.setItem(ACTIVE_OUTLET_STORAGE_KEY, String(outletId))
    } else {
      localStorage.removeItem(ACTIVE_OUTLET_STORAGE_KEY)
    }
  }, [outletId])

  const departmentsQuery = useAssignedOutletDepartments(outletId)
  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data])
  const isLoadingDepartments = departmentsQuery.isLoading
  const showDepartmentPicker = departments.length > 1

  const regularUserHasValidOutlet =
    isLoadingOutlets || (!outletQueryFailed && outletId !== null && outlets.some((outlet) => outlet.id === outletId))

  const [departmentId, setDepartmentId] = useState<number | null>(() =>
    readStoredId(ACTIVE_DEPARTMENT_STORAGE_KEY),
  )

  useEffect(() => {
    if (isLoadingDepartments) return
    if (departments.length === 0) {
      if (departmentId !== null) setDepartmentId(null)
      return
    }
    const stillValid = departmentId !== null && departments.some((d) => d.id === departmentId)
    if (!stillValid) setDepartmentId(departments[0].id)
  }, [departments, isLoadingDepartments, departmentId])

  useEffect(() => {
    if (departmentId !== null) {
      localStorage.setItem(ACTIVE_DEPARTMENT_STORAGE_KEY, String(departmentId))
    } else {
      localStorage.removeItem(ACTIVE_DEPARTMENT_STORAGE_KEY)
    }
  }, [departmentId])

  const outletAccessState = outletQueryFailed
    ? (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-medium">Unable to load your outlet access.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {outletQueryErrorMessage}
          </p>
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => void assignedOutletsQuery.refetch()}
          >
            Try again
          </button>
        </div>
      )
    : !isLoadingOutlets && outlets.length === 0
      ? (
          <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium">No outlet is assigned to this employee.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask an administrator to assign at least one outlet, then refresh this page.
            </p>
          </div>
        )
      : null

  return (
    <ActiveOutletContext.Provider
      value={{
        outletId,
        setOutletId,
        outlets,
        isLoadingOutlets,
        showOutletPicker,
        departmentId,
        setDepartmentId,
        departments,
        isLoadingDepartments,
        showDepartmentPicker,
      }}
    >
      {outletAccessState ?? (regularUserHasValidOutlet ? children : null)}
    </ActiveOutletContext.Provider>
  )
}

export function useActiveOutlet(): ActiveOutletContextValue {
  const ctx = useContext(ActiveOutletContext)
  if (!ctx) {
    throw new Error("useActiveOutlet must be used within an ActiveOutletProvider")
  }
  return ctx
}
