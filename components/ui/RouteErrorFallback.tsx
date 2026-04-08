'use client';

import { useEffect } from 'react';

interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Sport or section label, e.g. "College Baseball", "MLB" */
  label: string;
  /** Emoji displayed above the heading */
  emoji?: string;
  /** Log tag for console, e.g. "college-baseball", "mlb" */
  logTag: string;
  /** "Back to X" link target */
  backHref: string;
  /** "Back to X" link label (defaults to "Back to {label} hub") */
  backLabel?: string;
}

/**
 * Shared route-level error fallback.
 * Used by all sport and section error.tsx files for consistent
 * heritage styling, logging, and recovery UX.
 */
export function RouteErrorFallback({
  error,
  reset,
  label,
  emoji = '\u26A0\uFE0F',
  logTag,
  backHref,
  backLabel,
}: RouteErrorFallbackProps) {
  useEffect(() => {
    console.error(`[BSI:${logTag}] Route error:`, error);
  }, [error, logTag]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-background-secondary border border-border-strong rounded-sm p-8 text-center">
        <div className="text-4xl mb-4">{emoji}</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {label} data unavailable
        </h2>
        <p className="text-text-muted text-sm mb-6">
          {error.message ||
            `Unable to load ${label} data. This may be a temporary issue with our data provider.`}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-burnt-orange hover:bg-burnt-orange/80 text-white rounded-sm font-medium transition-colors"
        >
          Try again
        </button>
        <a
          href={backHref}
          className="block mt-3 text-sm text-burnt-orange hover:text-ember transition-colors"
        >
          {backLabel || `Back to ${label} hub`}
        </a>
      </div>
    </div>
  );
}
