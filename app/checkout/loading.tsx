import { Skeleton } from '@/components/ui/Skeleton';

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg px-4">
        <div className="text-center mb-8">
          <Skeleton variant="text" width={200} height={28} className="mx-auto mb-2" />
          <Skeleton variant="text" width={160} height={14} className="mx-auto" />
        </div>
        <div className="bg-surface-light border border-border-subtle rounded-sm p-8 animate-pulse">
          <Skeleton variant="text" width="60%" height={20} className="mb-6" />
          <Skeleton variant="text" width="100%" height={40} className="rounded-sm mb-4" />
          <Skeleton variant="text" width="100%" height={40} className="rounded-sm mb-4" />
          <div className="flex gap-4 mb-6">
            <Skeleton variant="text" width="50%" height={40} className="rounded-sm" />
            <Skeleton variant="text" width="50%" height={40} className="rounded-sm" />
          </div>
          <Skeleton variant="rectangular" width="100%" height={48} className="rounded-sm" />
        </div>
      </div>
    </div>
  );
}
