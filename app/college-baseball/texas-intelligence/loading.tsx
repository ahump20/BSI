import { Skeleton } from '@/components/ui/Skeleton';

export default function TexasIntelLoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={200} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={480} height={48} className="mx-auto mb-6" />
        <Skeleton variant="text" width={500} height={20} className="mx-auto mb-8" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={180} className="rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
