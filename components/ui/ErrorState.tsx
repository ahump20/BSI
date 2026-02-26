'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  error,
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  const errorMessage =
    error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md border border-red-900/30 bg-red-900/10 backdrop-blur-xl rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-semibold text-text-primary">Error</h2>
        </div>

        <p className="text-text-secondary mb-6 text-sm">
          {errorMessage}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-burnt-orange hover:bg-burnt-orange/80 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </>
            )}
          </button>

          <Link
            href="/"
            className="flex-1 px-4 py-2 border border-border-strong hover:border-text-tertiary text-text-primary font-semibold rounded-lg transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
