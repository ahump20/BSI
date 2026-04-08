'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function PageError({
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
      label="Something went wrong"
      emoji="&#9888;"
      logTag="terms"
      backHref="/terms"
    />
  );
}
