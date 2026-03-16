import { Skeleton, SkeletonStandingsTable } from '@/components/ui/Skeleton';

export default function PlayersLoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={160} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={400} height={48} className="mx-auto mb-6" />
        <div className="flex gap-4 justify-center">
          <Skeleton variant="rectangular" width={120} height={40} className="rounded-sm" />
          <Skeleton variant="rectangular" width={200} height={40} className="rounded-sm" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <SkeletonStandingsTable rows={15} columns={8} />
      </div>
    </div>
  );
}
