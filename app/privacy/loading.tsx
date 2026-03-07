import { Skeleton } from '@/components/ui/Skeleton';

export default function PrivacyLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton variant="text" width={280} height={40} className="mb-3" />
        <Skeleton variant="text" width={180} height={12} className="mb-8" />

        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="mb-8 animate-pulse">
            <Skeleton variant="text" width={200} height={22} className="mb-4" />
            <Skeleton variant="text" width="100%" height={14} className="mb-2" />
            <Skeleton variant="text" width="95%" height={14} className="mb-2" />
            <Skeleton variant="text" width="85%" height={14} className="mb-2" />
            <Skeleton variant="text" width="70%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}
