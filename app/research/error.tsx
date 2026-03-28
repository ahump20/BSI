'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ResearchError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BSI:research] Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--surface-dugout)] border border-[rgba(140,98,57,0.5)] rounded-sm p-8 text-center">
        <div className="text-4xl mb-4">&#128218;</div>
        <h2 className="text-xl font-bold text-[var(--bsi-bone)] mb-2">Research unavailable</h2>
        <p className="text-[rgba(196,184,165,0.35)] text-sm mb-6">
          {error.message || 'Unable to load research data. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[var(--bsi-primary)] hover:bg-[var(--bsi-primary)]/80 text-white rounded-sm font-medium transition-colors"
        >
          Try again
        </button>
        <a
          href="/research"
          className="block mt-3 text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
        >
          Back to Research
        </a>
      </div>
    </div>
  );
}
