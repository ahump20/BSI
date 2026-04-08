'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function VisionAIError({
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
      label="Vision AI"
      emoji="&#128065;"
      logTag="vision-ai"
      backHref="/vision-ai"
    />
  );
}
