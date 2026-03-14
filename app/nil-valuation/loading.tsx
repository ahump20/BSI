import { Skeleton } from '@/components/ui/Skeleton';

export default function NILValuationLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero skeleton */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Skeleton variant="rectangular" width={120} height={22} className="rounded-full mx-auto mb-4" />
          <Skeleton variant="text" width={320} height={44} className="mx-auto mb-4" />
          <Skeleton variant="text" width="80%" height={18} className="mx-auto mb-2" />
          <Skeleton variant="text" width="60%" height={18} className="mx-auto mb-6" />
          <div className="flex gap-4 justify-center">
            <Skeleton variant="rectangular" width={180} height={44} className="rounded-sm" />
            <Skeleton variant="rectangular" width={160} height={44} className="rounded-sm" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center animate-pulse">
              <Skeleton variant="text" width={80} height={36} className="mx-auto mb-2" />
              <Skeleton variant="text" width={100} height={14} className="mx-auto" />
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-6 animate-pulse">
              <Skeleton variant="rectangular" width={28} height={28} className="rounded-sm mb-4" />
              <Skeleton variant="text" width="60%" height={18} className="mb-2" />
              <Skeleton variant="text" width="100%" height={12} className="mb-1" />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
