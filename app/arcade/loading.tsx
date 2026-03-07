import { Skeleton, SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function ArcadeLoading() {
  return (
    <div className="min-h-screen bg-midnight">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <SkeletonPageHeader />
        <div className="flex flex-wrap gap-2 mb-8 mt-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width={90} height={36} className="rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-xl p-6 animate-pulse">
              <Skeleton variant="rectangular" width={56} height={56} className="rounded-xl mb-4" />
              <Skeleton variant="text" width="70%" height={20} className="mb-2" />
              <Skeleton variant="text" width="100%" height={14} className="mb-1" />
              <Skeleton variant="text" width="60%" height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
