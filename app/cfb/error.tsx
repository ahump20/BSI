'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function CFBError({
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
      label="College Football"
      emoji="&#127944;"
      logTag="cfb"
      backHref="/cfb"
    />
  );
}
