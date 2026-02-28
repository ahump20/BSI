import { Skeleton } from '@/components/ui/Skeleton';

export default function SearchLoading() {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-12">
      <Skeleton variant="rectangular" width="100%" height={48} className="rounded-lg mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton variant="rectangular" width={48} height={48} className="rounded shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" height={18} />
              <Skeleton variant="text" width="100%" height={14} />
              <Skeleton variant="text" width="40%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
