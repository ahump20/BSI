'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function SwingError({
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
      label="Swing analysis"
      emoji="&#9918;"
      logTag="swing"
      backHref="/swing"
    />
  );
}
