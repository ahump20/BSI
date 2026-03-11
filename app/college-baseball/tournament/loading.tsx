import { Skeleton, SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function TournamentLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <SkeletonPageHeader />
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-light border border-border-subtle rounded-xl p-6 animate-pulse">
              <Skeleton variant="rectangular" width={100} height={22} className="rounded-full mb-3" />
              <Skeleton variant="text" width="80%" height={20} className="mb-2" />
              <Skeleton variant="text" width="100%" height={14} className="mb-1" />
              <Skeleton variant="text" width="70%" height={14} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={56} className="rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
