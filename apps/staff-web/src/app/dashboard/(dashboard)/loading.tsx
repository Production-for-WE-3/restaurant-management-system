import { LoadingFallback } from "@rms/ui/skeletons"
import { TableSkeleton } from "@rms/ui/skeletons"

/**
 * Route-level Suspense fallback for every dashboard page.
 *
 * Next.js wraps this in a Suspense boundary so the sidebar and header render
 * instantly from the server, and only the <main> content area shows this
 * placeholder during navigation or initial hydration. The LoadingFallback
 * wrapper suppresses it for the first 200 ms so fast/cached navigations never
 * flash a skeleton at all.
 */
export default function DashboardLoading() {
  return (
    <LoadingFallback>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        </div>
        <TableSkeleton rows={10} columns={5} />
      </div>
    </LoadingFallback>
  )
}
