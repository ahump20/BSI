'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CollegeBaseballError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI:college-baseball] Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-charcoal border border-white/15 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">&#9918;</div>
        <h2 className="text-xl font-bold text-white mb-2">College Baseball data unavailable</h2>
        <p className="text-white/60 text-sm mb-6">
          {error.message || 'Unable to load college baseball data. This may be a temporary issue with our data provider.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-burnt-orange hover:bg-burnt-orange/80 text-white rounded-lg font-medium transition-colors"
        >
          Try again
        </button>
        <a
          href="/college-baseball"
          className="block mt-3 text-sm text-burnt-orange hover:text-ember transition-colors"
        >
          Back to College Baseball hub
        </a>
      </div>
    </div>
  );
}
