import { Skeleton } from '@/components/ui/Skeleton';

export default function DataSourcesLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Eyebrow + heading */}
        <Skeleton variant="text" width={100} height={10} className="mb-4" />
        <Skeleton variant="text" width={200} height={36} className="mb-3" />
        <Skeleton variant="text" width="80%" height={18} className="mb-2" />
        <Skeleton variant="text" width="60%" height={18} className="mb-12" />

        {/* Provider cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-6 mb-4 animate-pulse">
            <div className="flex justify-between mb-3">
              <div>
                <Skeleton variant="text" width={140} height={18} className="mb-1" />
                <Skeleton variant="text" width={280} height={12} />
              </div>
              <div className="flex gap-1.5">
                <Skeleton variant="rectangular" width={70} height={20} className="rounded-sm" />
                <Skeleton variant="rectangular" width={50} height={20} className="rounded-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Skeleton variant="text" width={50} height={10} className="mb-1" />
                <Skeleton variant="text" width="90%" height={14} />
              </div>
              <div>
                <Skeleton variant="text" width={40} height={10} className="mb-1" />
                <Skeleton variant="text" width="80%" height={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
