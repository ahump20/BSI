import { Skeleton, SkeletonStandingsTable, ScoreCardSkeletonList } from '@/components/ui/Skeleton';

export default function NBALoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={120} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={360} height={48} className="mx-auto mb-6" />
        <Skeleton variant="text" width={480} height={20} className="mx-auto mb-8" />
        <div className="flex gap-4 justify-center">
          <Skeleton variant="rectangular" width={160} height={44} className="rounded-lg" />
          <Skeleton variant="rectangular" width={160} height={44} className="rounded-lg" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <SkeletonStandingsTable rows={5} columns={7} />
        <ScoreCardSkeletonList count={4} />
      </div>
    </div>
  );
}
