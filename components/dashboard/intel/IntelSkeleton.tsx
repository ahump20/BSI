'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function IntelSkeleton() {
  return (
    <div className="animate-in fade-in duration-300 mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={40} height={40} className="!rounded-[2px]" />
          <div>
            <Skeleton variant="text" width={180} height={24} />
            <Skeleton variant="text" width={220} height={14} className="mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={60} height={32} className="!rounded-[2px]" />
          <div className="text-right">
            <Skeleton variant="text" width={70} height={16} />
            <Skeleton variant="text" width={90} height={12} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Masthead rule skeleton */}
      <div className="mb-5 h-px bg-white/[0.08]" />

      {/* Sport filter skeleton */}
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={48} height={32} className="!rounded-none" />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Main column */}
        <div className="space-y-4">
          {/* Priority signals skeleton */}
          <div className="intel-panel p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="intel-panel-elevated p-3">
                  <Skeleton variant="text" width="80%" height={14} />
                  <Skeleton variant="text" width="60%" height={12} className="mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Hero card skeleton */}
          <div className="intel-panel p-4">
            <Skeleton variant="rectangular" width="100%" height={200} className="!rounded-[2px]" />
          </div>

          {/* Marquee row skeleton */}
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="intel-panel min-w-[260px] flex-1 p-3">
                <Skeleton variant="text" width="70%" height={16} />
                <Skeleton variant="text" width="50%" height={14} className="mt-2" />
                <Skeleton variant="text" width="90%" height={12} className="mt-2" />
              </div>
            ))}
          </div>

          {/* Standard cards skeleton */}
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="intel-panel p-3"
                style={{ borderLeftWidth: '3px', borderLeftColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" width="40%" height={14} />
                  <Skeleton variant="rectangular" width={50} height={20} className="!rounded-[1px]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4 lg:border-l lg:border-white/[0.08] lg:pl-6">
          {/* Signal feed skeleton */}
          <div className="intel-panel p-4">
            <Skeleton variant="text" width={100} height={16} className="mb-3" />
            <div className="h-px bg-white/[0.08] mb-3" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="intel-panel-elevated p-3 mb-3">
                <Skeleton variant="text" width="90%" height={12} />
                <Skeleton variant="text" width="60%" height={10} className="mt-1" />
              </div>
            ))}
          </div>

          {/* Standings skeleton */}
          <div className="intel-panel p-4">
            <Skeleton variant="text" width={80} height={16} className="mb-3" />
            <div className="h-px bg-white/[0.08] mb-3" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="text" width="100%" height={14} className="mb-2" />
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="intel-panel p-4">
            <Skeleton variant="text" width={100} height={16} className="mb-3" />
            <Skeleton variant="rectangular" width="100%" height={140} className="!rounded-[2px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
