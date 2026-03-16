import { Skeleton, SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function ModelsLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <SkeletonPageHeader />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-6 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <Skeleton variant="rectangular" width={80} height={22} className="rounded-sm" />
                <Skeleton variant="text" width={32} height={14} />
              </div>
              <Skeleton variant="text" width="70%" height={20} className="mb-2" />
              <Skeleton variant="text" width="100%" height={14} className="mb-1" />
              <Skeleton variant="text" width="85%" height={14} className="mb-4" />
              <div className="flex gap-1.5">
                <Skeleton variant="rectangular" width={64} height={18} className="rounded-sm" />
                <Skeleton variant="rectangular" width={56} height={18} className="rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
