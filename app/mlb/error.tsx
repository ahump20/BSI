'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function MLBError({
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
      label="MLB"
      emoji="&#9918;"
      logTag="mlb"
      backHref="/mlb"
    />
  );
}
