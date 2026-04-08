'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function SavantError({
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
      label="Savant analytics"
      emoji="&#128202;"
      logTag="savant"
      backHref="/college-baseball/savant"
    />
  );
}
