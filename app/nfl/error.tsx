'use client';

export default function NFLError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="font-display text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-text-secondary mb-6">
          We hit an error loading this NFL page. This might be a temporary issue with our data
          source.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/90 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/nfl"
            className="px-6 py-3 bg-graphite text-white rounded-lg font-semibold hover:bg-white/10 border border-border-subtle transition-colors"
          >
            NFL Home
          </a>
        </div>
      </div>
    </div>
  );
}
