import { Skeleton } from '@/components/ui/Skeleton';

export default function ContactLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Skeleton variant="text" width={280} height={40} className="mx-auto mb-4" />
          <Skeleton variant="text" width={340} height={16} className="mx-auto" />
        </div>
        <div className="max-w-xl mx-auto bg-surface-light border border-border-subtle rounded-sm p-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-6">
              <Skeleton variant="text" width={60} height={14} className="mb-2" />
              <Skeleton variant="rectangular" width="100%" height={42} className="rounded-sm" />
            </div>
          ))}
          <div className="mb-6">
            <Skeleton variant="text" width={70} height={14} className="mb-2" />
            <Skeleton variant="rectangular" width="100%" height={120} className="rounded-sm" />
          </div>
          <Skeleton variant="rectangular" width="100%" height={48} className="rounded-sm" />
        </div>
      </div>
    </div>
  );
}
