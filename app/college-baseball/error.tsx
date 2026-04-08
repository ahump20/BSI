'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function CollegeBaseballError({
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
      label="College Baseball"
      emoji="&#9918;"
      logTag="college-baseball"
      backHref="/college-baseball"
    />
  );
}
