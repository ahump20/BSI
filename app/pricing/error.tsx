'use client';

import { RouteErrorFallback } from '@/components/ui/RouteErrorFallback';

export default function PricingError({
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
      label="Pricing"
      emoji="&#128176;"
      logTag="pricing"
      backHref="/pricing"
    />
  );
}
