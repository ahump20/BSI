'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MLBError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI:mlb] Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">&#9918;</div>
        <h2 className="text-xl font-bold text-[#FAF8F5] mb-2">MLB data unavailable</h2>
        <p className="text-[#999] text-sm mb-6">
          {error.message || 'Unable to load MLB data. This may be a temporary issue with our data provider.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#BF5700] hover:bg-[#A34900] text-white rounded-lg font-medium transition-colors"
        >
          Try again
        </button>
        <a
          href="/mlb"
          className="block mt-3 text-sm text-[#BF5700] hover:text-[#FF6B35] transition-colors"
        >
          Back to MLB hub
        </a>
      </div>
    </div>
  );
}
