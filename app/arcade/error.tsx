'use client';

import { useEffect } from 'react';
import { getPostHog } from '@/lib/analytics/posthog';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ArcadeError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI] Arcade route error:', error);
    getPostHog()?.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_source: 'error_boundary',
      route_group: 'arcade',
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-background-secondary border border-border-strong rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">&#9888;</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-text-muted text-sm mb-6">
          {error.message || 'An unexpected error occurred loading the arcade.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-burnt-orange hover:bg-burnt-orange/80 text-white rounded-lg font-medium transition-colors"
        >
          Try again
        </button>
        {error.digest && (
          <p className="mt-4 text-xs text-text-muted">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
