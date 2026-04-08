'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function BlogError({
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
      label="Content"
      emoji="&#128221;"
      logTag="blog"
      backHref="/blog-post-feed"
    />
  );
}
