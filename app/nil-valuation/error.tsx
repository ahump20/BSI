'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function NILValuationError({
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
      label="NIL"
      emoji="&#128176;"
      logTag="nil-valuation"
      backHref="/nil-valuation"
    />
  );
}
