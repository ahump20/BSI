import { Skeleton } from '@/components/ui/Skeleton';

export default function SwingLoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={160} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={440} height={48} className="mx-auto mb-6" />
        <Skeleton variant="text" width={500} height={20} className="mx-auto mb-8" />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton variant="rectangular" width="100%" height={300} className="rounded-sm" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton variant="rectangular" width="100%" height={120} className="rounded-sm" />
          <Skeleton variant="rectangular" width="100%" height={120} className="rounded-sm" />
        </div>
      </div>
    </div>
  );
}
