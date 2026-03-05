import { Skeleton } from '@/components/ui/Skeleton';

export default function TransferPortalLoading() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <Skeleton variant="text" width={240} height={40} className="mb-2" />
      <Skeleton variant="text" width={360} height={18} className="mb-8" />
      <div className="flex gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={120} height={36} className="rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={140} className="rounded-lg" />
        ))}
      </div>
    </div>
  );
}
