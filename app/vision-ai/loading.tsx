import { Skeleton } from '@/components/ui/Skeleton';

export default function VisionAILoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero skeleton */}
        <div className="mb-6 flex gap-2">
          <Skeleton variant="rectangular" width={160} height={22} className="rounded-full" />
          <Skeleton variant="rectangular" width={130} height={22} className="rounded-full" />
          <Skeleton variant="rectangular" width={110} height={22} className="rounded-full" />
        </div>
        <Skeleton variant="text" width="70%" height={48} className="mb-4" />
        <Skeleton variant="text" width="90%" height={20} className="mb-2" />
        <Skeleton variant="text" width="60%" height={20} className="mb-8" />

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-4 text-center animate-pulse">
              <Skeleton variant="text" width={60} height={28} className="mx-auto mb-2" />
              <Skeleton variant="text" width={100} height={10} className="mx-auto" />
            </div>
          ))}
        </div>

        {/* Nav bar skeleton */}
        <div className="flex gap-2 mb-8 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={80} height={36} className="rounded-sm shrink-0" />
          ))}
        </div>

        {/* 8-card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="rectangular" width={50} height={18} className="rounded-full" />
              </div>
              <Skeleton variant="text" width="80%" height={16} className="mb-2" />
              <Skeleton variant="text" width="100%" height={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
