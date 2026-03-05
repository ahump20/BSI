import { Skeleton, SkeletonStandingsTable, ScoreCardSkeletonList } from '@/components/ui/Skeleton';

export default function CollegeBaseballLoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={160} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={440} height={48} className="mx-auto mb-6" />
        <Skeleton variant="text" width={500} height={20} className="mx-auto mb-8" />
        <div className="flex gap-4 justify-center">
          <Skeleton variant="rectangular" width={140} height={44} className="rounded-lg" />
          <Skeleton variant="rectangular" width={140} height={44} className="rounded-lg" />
          <Skeleton variant="rectangular" width={140} height={44} className="rounded-lg" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <ScoreCardSkeletonList count={6} />
        <SkeletonStandingsTable rows={8} columns={7} />
      </div>
    </div>
  );
}
