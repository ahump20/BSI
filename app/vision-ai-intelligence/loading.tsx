import { Skeleton } from '@/components/ui/Skeleton';

export default function VisionAIIntelligenceLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <Skeleton variant="text" width={100} height={10} className="mb-4" />
        <Skeleton variant="text" width={300} height={36} className="mb-3" />
        <Skeleton variant="text" width="45%" height={18} className="mb-10" />

        {/* Controls bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width={100} height={40} className="rounded-lg" />
          ))}
        </div>

        {/* Video feed + sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video area */}
          <div className="lg:col-span-2">
            <div className="bg-surface-light border border-border-subtle rounded-xl overflow-hidden animate-pulse">
              <Skeleton variant="rectangular" width="100%" height={400} />
              <div className="p-4 flex justify-between items-center">
                <Skeleton variant="text" width={120} height={14} />
                <div className="flex gap-2">
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton variant="circular" width={36} height={36} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar panels */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-light border border-border-subtle rounded-xl p-5 animate-pulse">
                <Skeleton variant="text" width={140} height={16} className="mb-3" />
                <Skeleton variant="text" width="100%" height={14} className="mb-2" />
                <Skeleton variant="text" width="90%" height={14} className="mb-2" />
                <Skeleton variant="text" width="70%" height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
