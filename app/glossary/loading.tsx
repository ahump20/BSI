import { Skeleton } from '@/components/ui/Skeleton';

export default function GlossaryLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Skeleton variant="text" width={200} height={14} className="mb-8" />

        {/* Header */}
        <Skeleton variant="text" width={100} height={10} className="mb-4" />
        <Skeleton variant="text" width={280} height={36} className="mb-3" />
        <Skeleton variant="text" width={400} height={18} className="mb-8" />

        {/* Search + Filters */}
        <div className="flex gap-3 mb-6">
          <Skeleton variant="rectangular" width="60%" height={42} className="rounded-sm" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" width={70} height={36} className="rounded-sm" />
            ))}
          </div>
        </div>

        {/* Alphabetical nav */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {Array.from({ length: 26 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={32} height={32} className="rounded-sm" />
          ))}
        </div>

        {/* Terms */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-l-2 border-burnt-orange/10 pl-5 py-4 mb-4 animate-pulse">
            <Skeleton variant="text" width={160} height={20} className="mb-3" />
            <Skeleton variant="text" width="100%" height={14} className="mb-1" />
            <Skeleton variant="text" width="90%" height={14} className="mb-1" />
            <Skeleton variant="text" width="70%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}
