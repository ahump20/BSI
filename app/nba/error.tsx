'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function NBAError({
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
      label="NBA"
      emoji="&#127936;"
      logTag="nba"
      backHref="/nba"
    />
  );
}
