'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AboutError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI:about] Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-background-secondary border border-border-strong rounded-sm p-8 text-center">
        <div className="text-4xl mb-4">&#128214;</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Page unavailable</h2>
        <p className="text-text-muted text-sm mb-6">
          {error.message || 'Unable to load this page. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-burnt-orange hover:bg-burnt-orange/80 text-white rounded-sm font-medium transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="block mt-3 text-sm text-burnt-orange hover:text-ember transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
