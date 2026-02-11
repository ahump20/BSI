'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent } from '@/components/ui/Card';

export function IntelSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
          <div>
            <Skeleton variant="text" width={180} height={24} />
            <Skeleton variant="text" width={220} height={14} className="mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={60} height={32} className="rounded-md" />
          <div className="text-right">
            <Skeleton variant="text" width={70} height={16} />
            <Skeleton variant="text" width={90} height={12} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Sport filter skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={48} height={32} className="rounded-lg" />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Main column */}
        <div className="space-y-6">
          {/* Priority signals skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="default" padding="none">
                <CardContent>
                  <Skeleton variant="text" width="80%" height={14} />
                  <Skeleton variant="text" width="60%" height={12} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hero card skeleton */}
          <Card variant="default" padding="none">
            <CardContent>
              <Skeleton variant="rectangular" width="100%" height={200} className="rounded-lg" />
            </CardContent>
          </Card>

          {/* Marquee row skeleton */}
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="default" padding="none" className="min-w-[260px] flex-1">
                <CardContent>
                  <Skeleton variant="text" width="70%" height={16} />
                  <Skeleton variant="text" width="50%" height={14} className="mt-2" />
                  <Skeleton variant="text" width="90%" height={12} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Standard cards skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="default" padding="none">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Skeleton variant="text" width="40%" height={14} />
                    <Skeleton variant="rectangular" width={50} height={20} className="rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Signal feed skeleton */}
          <Card variant="default" padding="none">
            <CardContent>
              <Skeleton variant="text" width={100} height={16} className="mb-3" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-3">
                  <Skeleton variant="text" width="90%" height={12} />
                  <Skeleton variant="text" width="60%" height={10} className="mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Standings skeleton */}
          <Card variant="default" padding="none">
            <CardContent>
              <Skeleton variant="text" width={80} height={16} className="mb-3" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="text" width="100%" height={14} className="mb-2" />
              ))}
            </CardContent>
          </Card>

          {/* Chart skeleton */}
          <Card variant="default" padding="none">
            <CardContent>
              <Skeleton variant="text" width={100} height={16} className="mb-3" />
              <Skeleton variant="rectangular" width="100%" height={140} className="rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
