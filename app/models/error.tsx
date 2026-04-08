'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function ModelsError({
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
      label="Model"
      emoji="&#128202;"
      logTag="models"
      backHref="/models"
    />
  );
}
