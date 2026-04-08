'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function IntelError({
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
      label="Intel"
      emoji="&#128161;"
      logTag="intel"
      backHref="/intel"
    />
  );
}
