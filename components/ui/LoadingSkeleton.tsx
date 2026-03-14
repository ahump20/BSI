/**
 * Standardized loading skeletons for BSI data surfaces.
 * Use these instead of one-off spinner divs for consistent loading states.
 */

interface SkeletonProps {
  className?: string;
}

/** Single shimmer bar */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-surface-light ${className}`}
      aria-hidden="true"
    />
  );
}

/** Card-shaped skeleton with header and 3 rows */
export function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`rounded-sm border border-border-subtle p-4 space-y-3 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/** Table-shaped skeleton: header row + N data rows */
export function TableSkeleton({ rows = 5, cols = 6, className = '' }: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={`rounded-sm border border-border-subtle overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-charcoal border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3 border-b border-border-subtle last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`${r}-${c}`} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Stat grid skeleton — 4 cards in a row */
export function StatGridSkeleton({ count = 4, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-sm border border-border-subtle p-4 space-y-2">
          <Skeleton className="h-3 w-1/2 mx-auto" />
          <Skeleton className="h-8 w-2/3 mx-auto" />
        </div>
      ))}
    </div>
  );
}

/** Full page loading state with BSI spinner */
export function PageLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
    </div>
  );
}
