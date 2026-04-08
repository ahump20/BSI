'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PageError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI] Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-sm border p-8 text-center bg-surface-dugout border-border-vintage">
        <h2 className="text-xl font-bold mb-2 text-bsi-bone">Something went wrong</h2>
        <p className="text-sm mb-6 text-bsi-dust">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="btn-heritage-fill px-6 py-2.5 rounded-sm font-medium transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="block mt-3 text-sm transition-colors text-heritage-columbia"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
