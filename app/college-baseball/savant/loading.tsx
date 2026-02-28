import { Skeleton } from '@/components/ui/Skeleton';

export default function SavantLoading() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <Skeleton variant="text" width={120} height={16} className="mb-4" />
      <Skeleton variant="text" width={320} height={40} className="mb-2" />
      <Skeleton variant="text" width={480} height={18} className="mb-8" />
      <div className="flex gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={100} height={36} className="rounded-full" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton variant="rectangular" width="100%" height={48} className="rounded-lg" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={40} className="rounded" />
        ))}
      </div>
    </div>
  );
}
