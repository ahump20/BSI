'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function ResearchError({
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
      label="Research"
      emoji="&#128218;"
      logTag="research"
      backHref="/research"
    />
  );
}
