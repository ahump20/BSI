import { Skeleton } from '@/components/ui/Skeleton';

export default function CoverageLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Skeleton variant="rectangular" width={120} height={22} className="rounded-full mx-auto mb-4" />
          <Skeleton variant="text" width={360} height={44} className="mx-auto mb-4" />
          <Skeleton variant="text" width="70%" height={18} className="mx-auto mb-2" />
          <Skeleton variant="text" width="50%" height={18} className="mx-auto" />
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

        {/* Sport cards */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface-light border border-border-subtle rounded-xl p-6 mb-6 animate-pulse">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton variant="circular" width={36} height={36} />
                  <div>
                    <Skeleton variant="text" width={120} height={20} className="mb-1" />
                    <Skeleton variant="rectangular" width={90} height={18} className="rounded-full" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <Skeleton variant="text" width={80} height={12} className="mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} variant="text" width="90%" height={14} />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton variant="text" width={80} height={12} className="mb-2" />
                <div className="flex gap-2">
                  <Skeleton variant="rectangular" width={60} height={20} className="rounded-full" />
                  <Skeleton variant="rectangular" width={50} height={20} className="rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
