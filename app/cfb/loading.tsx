import { Skeleton, SkeletonStandingsTable } from '@/components/ui/Skeleton';

export default function CFBLoading() {
  return (
    <div className="min-h-screen">
      <div className="py-16 px-4 text-center">
        <Skeleton variant="text" width={120} height={28} className="mx-auto mb-4" />
        <Skeleton variant="text" width={400} height={48} className="mx-auto mb-6" />
        <Skeleton variant="text" width={480} height={20} className="mx-auto mb-8" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <SkeletonStandingsTable rows={6} columns={8} />
        <SkeletonStandingsTable rows={6} columns={8} />
      </div>
    </div>
  );
}
