import { Skeleton } from '@/components/ui/Skeleton';

export default function SocialIntelLoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={180} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={460} height={48} className="mx-auto mb-6" />
        <Skeleton variant="text" width={500} height={20} className="mx-auto mb-8" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={160} className="rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
