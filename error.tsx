'use client';

import { useEffect } from 'react';
import { getPostHog } from '@/lib/analytics/posthog';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NFLError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI] NFL route error:', error);
    getPostHog()?.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_source: 'error_boundary',
      route_group: 'nfl',
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">&#9888;</div>
        <h2 className="text-xl font-bold text-[#FAF8F5] mb-2">Something went wrong</h2>
        <p className="text-[#999] text-sm mb-6">
          {error.message || 'An unexpected error occurred loading NFL data.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#BF5700] hover:bg-[#A34900] text-white rounded-lg font-medium transition-colors"
        >
          Try again
        </button>
        {error.digest && (
          <p className="mt-4 text-xs text-[#666]">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
