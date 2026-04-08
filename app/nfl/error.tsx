'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function NFLError({
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
      label="NFL"
      emoji="&#127944;"
      logTag="nfl"
      backHref="/nfl"
    />
  );
}
