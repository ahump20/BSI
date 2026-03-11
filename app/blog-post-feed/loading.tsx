import { Skeleton } from '@/components/ui/Skeleton';

export default function BlogPostFeedLoading() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-border-subtle py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton variant="text" width={120} height={12} />
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Skeleton variant="text" width={80} height={10} className="mb-4" />
        <Skeleton variant="text" width={240} height={36} className="mb-3" />
        <Skeleton variant="text" width="60%" height={18} className="mb-2" />
        <Skeleton variant="text" width="50%" height={18} />
      </div>

      {/* Category tabs */}
      <div className="border-b border-border-subtle bg-midnight/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width={90} height={32} className="rounded-full" />
          ))}
        </div>
      </div>

      {/* Featured card */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-border-subtle bg-background-tertiary p-8 animate-pulse mb-10">
          <div className="flex gap-2 mb-4">
            <Skeleton variant="rectangular" width={70} height={22} className="rounded-md" />
            <Skeleton variant="rectangular" width={100} height={22} className="rounded-md" />
          </div>
          <Skeleton variant="text" width="70%" height={32} className="mb-3" />
          <Skeleton variant="text" width="50%" height={18} className="mb-4" />
          <Skeleton variant="text" width="80%" height={14} className="mb-2" />
          <Skeleton variant="text" width="60%" height={14} className="mb-6" />
          <div className="flex gap-4">
            <Skeleton variant="text" width={80} height={14} />
            <Skeleton variant="text" width={100} height={14} />
            <Skeleton variant="text" width={60} height={14} />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton variant="text" width={110} height={12} />
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Article grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-background-tertiary rounded-lg p-6 animate-pulse">
              <Skeleton variant="rectangular" width={90} height={20} className="rounded-md mb-3" />
              <Skeleton variant="text" width="85%" height={18} className="mb-2" />
              <Skeleton variant="text" width="100%" height={14} className="mb-1" />
              <Skeleton variant="text" width="90%" height={14} className="mb-1" />
              <Skeleton variant="text" width="60%" height={14} className="mb-4" />
              <div className="border-t border-border-subtle pt-3 flex justify-between">
                <Skeleton variant="text" width={80} height={12} />
                <Skeleton variant="text" width={40} height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
