import { Skeleton, SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function PricingLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <SkeletonPageHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-xl p-8 animate-pulse">
              <div className="text-center mb-6">
                <Skeleton variant="text" width={120} height={28} className="mx-auto mb-2" />
                <Skeleton variant="text" width={200} height={14} className="mx-auto" />
              </div>
              <Skeleton variant="text" width={100} height={48} className="mx-auto mb-8" />
              <div className="space-y-3 mb-8">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton variant="rectangular" width={20} height={20} className="rounded shrink-0" />
                    <Skeleton variant="text" width="80%" height={16} />
                  </div>
                ))}
              </div>
              <Skeleton variant="rectangular" width="100%" height={44} className="rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
