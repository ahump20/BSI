'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function TexasIntelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      label="Texas Intelligence"
      emoji="&#129416;"
      logTag="texas-intel"
      backHref="/college-baseball/texas-intelligence"
    />
  );
}
