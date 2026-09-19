import { LoadingFallback, TableSkeleton } from "@rms/ui/skeletons"

/**
 * Route-level Suspense fallback for staff PWA pages.
 * The header + tab bar render instantly; only the content area shows this.
 */
export default function StaffLoading() {
  return (
    <LoadingFallback>
      <div className="space-y-4">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <TableSkeleton rows={6} columns={3} />
      </div>
    </LoadingFallback>
  )
}
