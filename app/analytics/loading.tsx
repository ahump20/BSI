import { Skeleton } from '@/components/ui/Skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Eyebrow + heading */}
        <Skeleton variant="text" width={110} height={10} className="mb-4" />
        <Skeleton variant="text" width={320} height={36} className="mb-3" />
        <Skeleton variant="text" width="50%" height={18} className="mb-2" />
        <Skeleton variant="text" width="40%" height={18} className="mb-10" />

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-5 text-center animate-pulse">
              <Skeleton variant="text" width={80} height={32} className="mx-auto mb-2" />
              <Skeleton variant="text" width={100} height={14} className="mx-auto mb-1" />
              <Skeleton variant="text" width={60} height={10} className="mx-auto" />
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width={90} height={36} className="rounded-sm" />
          ))}
        </div>

        {/* Tool cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-6 animate-pulse">
              <Skeleton variant="circular" width={28} height={28} className="mb-4" />
              <Skeleton variant="text" width={160} height={20} className="mb-2" />
              <Skeleton variant="text" width="100%" height={14} className="mb-1" />
              <Skeleton variant="text" width="90%" height={14} className="mb-1" />
              <Skeleton variant="text" width="60%" height={14} className="mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton variant="rectangular" width={50} height={18} className="rounded-sm" />
                <Skeleton variant="rectangular" width={70} height={18} className="rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
