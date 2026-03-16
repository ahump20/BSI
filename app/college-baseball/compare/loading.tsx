import { Skeleton } from '@/components/ui/Skeleton';

export default function CompareLoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={200} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={440} height={48} className="mx-auto mb-6" />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <Skeleton variant="rectangular" width="100%" height={200} className="rounded-sm" />
          <Skeleton variant="rectangular" width="100%" height={200} className="rounded-sm" />
        </div>
        <Skeleton variant="rectangular" width="100%" height={300} className="rounded-sm" />
      </div>
    </div>
  );
}
