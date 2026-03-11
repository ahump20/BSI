import { Skeleton } from '@/components/ui/Skeleton';

export default function AuthLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Skeleton variant="text" width={120} height={12} className="mx-auto mb-3" />
          <Skeleton variant="text" width={240} height={32} className="mx-auto mb-3" />
          <Skeleton variant="text" width={300} height={16} className="mx-auto" />
        </div>
        <div className="bg-surface-light border border-border-subtle rounded-xl p-6 mb-6 animate-pulse">
          <Skeleton variant="text" width={140} height={20} className="mb-2" />
          <Skeleton variant="text" width="100%" height={14} className="mb-4" />
          <Skeleton variant="rectangular" width="100%" height={42} className="rounded-lg mb-3" />
          <Skeleton variant="rectangular" width="100%" height={40} className="rounded-lg" />
        </div>
        <div className="bg-surface-light border border-border-subtle rounded-xl p-6 animate-pulse">
          <Skeleton variant="text" width={130} height={20} className="mb-2" />
          <Skeleton variant="text" width="100%" height={14} className="mb-4" />
          <Skeleton variant="rectangular" width="100%" height={42} className="rounded-lg mb-3" />
          <Skeleton variant="rectangular" width="100%" height={48} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}
