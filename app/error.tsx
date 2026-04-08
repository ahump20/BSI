'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function Error({
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
      label="This page hit a snag"
      emoji="&#9888;"
      logTag="error.tsx"
      backHref="/error.tsx"
    />
  );
}
