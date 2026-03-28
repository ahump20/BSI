interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  className?: string;
  shimmer?: boolean;
}

export function Skeleton({ variant = 'rectangular', width, height, className = '', shimmer = true }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const variantClass =
    variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded-sm' : 'rounded-sm';

  return (
    <div
      className={`bg-surface ${shimmer ? 'bsi-shimmer' : 'animate-pulse'} ${variantClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--border-vintage)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton variant="text" height={16} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonScoreCard() {
  return (
    <div className="bg-[var(--surface-press-box)] rounded-sm p-4">
      <div className="flex justify-between items-center mb-3">
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width={40} height={24} />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width={40} height={24} />
      </div>
    </div>
  );
}

export function ScoreCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 100}ms` }}
          className="animate-fadeIn"
        >
          <SkeletonScoreCard />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="space-y-3">
      <Skeleton variant="text" width={200} height={28} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} className="rounded-sm" />
        <Skeleton variant="rectangular" width={80} height={32} className="rounded-sm" />
        <Skeleton variant="rectangular" width={80} height={32} className="rounded-sm" />
      </div>
    </div>
  );
}

/** Generic card-shaped skeleton — matches Card padding="md" footprint */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[var(--surface-press-box)] rounded-sm p-4 animate-pulse ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-surface-medium" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-medium rounded-sm w-3/4" />
          <div className="h-3 bg-surface-medium rounded-sm w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-surface-medium rounded-sm" />
        <div className="h-3 bg-surface-medium rounded-sm w-5/6" />
        <div className="h-3 bg-surface-medium rounded-sm w-4/6" />
      </div>
    </div>
  );
}

/** Table skeleton — rows of equally-spaced cells */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[var(--surface-press-box)] rounded-sm overflow-hidden animate-pulse" aria-hidden="true">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-[var(--border-vintage)] bg-surface-medium">
        {[40, 120, 80, 80, 60].map((w, i) => (
          <div key={i} className="h-3 bg-surface rounded-sm" style={{ width: w }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border-vintage)] last:border-0">
          {[40, 120, 80, 80, 60].map((w, j) => (
            <div key={j} className="h-3 bg-surface-medium rounded-sm" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStandingsTable({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-[var(--surface-press-box)] rounded-sm p-4">
      <Skeleton variant="text" width={140} height={20} className="mb-4" />
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-vintage)]">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="pb-2 px-2">
                <Skeleton variant="text" height={14} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
