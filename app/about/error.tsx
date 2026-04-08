'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function AboutError({
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
      label="Page"
      emoji="&#128214;"
      logTag="about"
      backHref="/about"
    />
  );
}
