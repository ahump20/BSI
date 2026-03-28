'use client';

import { useEffect } from 'react';
import { getPostHog } from '@/lib/analytics/posthog';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI] Dashboard route error:', error);
    getPostHog()?.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_source: 'error_boundary',
      route_group: 'dashboard',
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--surface-dugout)] border border-[rgba(140,98,57,0.5)] rounded-sm p-8 text-center">
        <div className="text-4xl mb-4">&#9888;</div>
        <h2 className="text-xl font-bold text-[var(--bsi-bone)] mb-2">Dashboard hit a snag</h2>
        <p className="text-[rgba(196,184,165,0.35)] text-sm mb-6">
          {error.message || 'Couldn\'t load the dashboard. Try refreshing — it usually clears up.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[var(--bsi-primary)] hover:bg-[var(--bsi-primary)]/80 text-white rounded-sm font-medium transition-colors"
        >
          Try again
        </button>
        {error.digest && (
          <p className="mt-4 text-xs text-[rgba(196,184,165,0.35)]">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
