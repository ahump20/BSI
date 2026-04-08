'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function ArcadeError({
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
      label="Arcade hit a snag"
      emoji="&#9888;"
      logTag="arcade"
      backHref="/arcade"
    />
  );
}
