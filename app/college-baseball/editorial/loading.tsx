import { Skeleton } from '@/components/ui/Skeleton';

export default function EditorialLoading() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <Skeleton variant="text" width={200} height={20} className="mb-4" />
      <Skeleton variant="text" width={400} height={40} className="mb-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <Skeleton variant="rectangular" width="100%" height={180} className="rounded-t-lg" />
            <div className="p-4 space-y-3">
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="100%" height={14} />
              <Skeleton variant="text" width="40%" height={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
