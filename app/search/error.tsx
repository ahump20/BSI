'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function SearchError({
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
      label="Search"
      emoji="&#128269;"
      logTag="search"
      backHref="/search"
    />
  );
}
