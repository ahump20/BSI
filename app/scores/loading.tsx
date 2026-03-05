import { ScoreCardSkeletonList, SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function ScoresLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <SkeletonPageHeader />
        <div className="mt-8">
          <ScoreCardSkeletonList count={8} />
        </div>
      </div>
    </div>
  );
}
