import { Skeleton } from '@/components/ui/Skeleton';

export default function IntelLoading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton variant="text" width={120} height={14} className="mb-3" />
          <Skeleton variant="text" width={280} height={36} className="mb-2" />
          <Skeleton variant="text" width={400} height={16} />
        </div>

        <div className="h-px bg-border-subtle mb-6" />

        {/* Filter bar skeleton */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" width={64} height={36} className="rounded-lg" />
            ))}
          </div>
          <Skeleton variant="rectangular" width={240} height={36} className="rounded-lg flex-1 min-w-[200px]" />
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {/* Hero card */}
            <Skeleton variant="rectangular" width="100%" height={200} className="rounded-xl" />
            {/* Marquee row */}
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" width={260} height={120} className="rounded-xl shrink-0" />
              ))}
            </div>
            {/* Standard cards */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={100} className="rounded-xl" />
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <Skeleton variant="rectangular" width="100%" height={200} className="rounded-xl" />
            <Skeleton variant="rectangular" width="100%" height={160} className="rounded-xl" />
            <Skeleton variant="rectangular" width="100%" height={240} className="rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
