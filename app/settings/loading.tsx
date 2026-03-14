import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton variant="text" width={90} height={10} className="mb-3" />
          <Skeleton variant="text" width={200} height={36} className="mb-2" />
          <Skeleton variant="text" width={360} height={14} />
          <div className="flex gap-2 mt-4">
            <Skeleton variant="rectangular" width={120} height={28} className="rounded-sm" />
            <Skeleton variant="rectangular" width={140} height={28} className="rounded-sm" />
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width={120} height={18} />
            </div>
            <div className="bg-surface-light border border-border-subtle rounded-sm p-5">
              <Skeleton variant="text" width="100%" height={42} className="rounded-sm mb-3" />
              <Skeleton variant="text" width="60%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
