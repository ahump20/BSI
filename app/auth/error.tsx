'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function AuthError({
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
      label="Authentication error"
      emoji="&#128274;"
      logTag="auth"
      backHref="/auth/login"
    />
  );
}
