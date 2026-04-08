'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function WBCError({
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
      label="WBC"
      emoji="&#127758;"
      logTag="wbc"
      backHref="/wbc"
    />
  );
}
