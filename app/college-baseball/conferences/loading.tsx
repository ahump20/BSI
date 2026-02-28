import { Skeleton } from '@/components/ui/Skeleton';

export default function ConferencesLoading() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <Skeleton variant="text" width={280} height={40} className="mb-2" />
      <Skeleton variant="text" width={420} height={18} className="mb-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={200} className="rounded-lg" />
        ))}
      </div>
    </div>
  );
}
