'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function EditorialError({
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
      label="Editorial content"
      emoji="&#128221;"
      logTag="editorial"
      backHref="/college-baseball/editorial"
    />
  );
}
