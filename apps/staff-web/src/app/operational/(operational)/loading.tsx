import { LoadingFallback, TableSkeleton } from "@rms/ui/skeletons"

/**
 * Route-level Suspense fallback for every operational page.
 * The header + nav render instantly; only <main> shows this skeleton.
 */
export default function OperationalLoading() {
  return (
    <LoadingFallback>
      <div className="space-y-4">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <TableSkeleton rows={8} columns={4} />
      </div>
    </LoadingFallback>
  )
}
