import { Skeleton } from '@/components/ui/Skeleton';

export default function AboutLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <Skeleton variant="text" width={160} height={12} className="mx-auto mb-6" />
          <Skeleton variant="text" width="80%" height={48} className="mx-auto mb-4" />
          <Skeleton variant="text" width="90%" height={24} className="mx-auto mb-2" />
          <Skeleton variant="text" width="70%" height={24} className="mx-auto" />
        </div>

        {/* Evidence strip */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-sm p-6 animate-pulse">
              <Skeleton variant="text" width={120} height={28} className="mb-2" />
              <Skeleton variant="text" width={100} height={10} className="mb-3" />
              <Skeleton variant="text" width="100%" height={12} className="mb-1" />
              <Skeleton variant="text" width="90%" height={12} className="mb-1" />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
          ))}
        </div>

        {/* Builder section */}
        <div className="grid md:grid-cols-5 gap-12">
          <div className="md:col-span-2 flex justify-center">
            <Skeleton variant="rectangular" width={256} height={341} className="rounded-sm" />
          </div>
          <div className="md:col-span-3">
            <Skeleton variant="text" width={80} height={10} className="mb-3" />
            <Skeleton variant="text" width={200} height={28} className="mb-8" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton variant="text" width="100%" height={14} className="mb-1" />
                  <Skeleton variant="text" width="95%" height={14} className="mb-1" />
                  <Skeleton variant="text" width="85%" height={14} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
