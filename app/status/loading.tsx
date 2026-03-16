import { Skeleton } from '@/components/ui/Skeleton';

export default function StatusLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Skeleton variant="text" width={180} height={14} className="mb-6" />

        {/* Header */}
        <Skeleton variant="text" width={240} height={36} className="mb-2" />
        <Skeleton variant="text" width={320} height={16} className="mb-8" />

        {/* Overall status banner */}
        <div className="bg-surface-light border border-border-subtle rounded-sm p-6 mb-8 animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" width={200} height={22} />
          </div>
          <Skeleton variant="text" width={160} height={12} className="mt-2" />
        </div>

        {/* Endpoint grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-4 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <Skeleton variant="text" width={120} height={16} />
                <Skeleton variant="circular" width={10} height={10} />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton variant="rectangular" width={60} height={20} className="rounded-sm" />
                <Skeleton variant="text" width={40} height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
