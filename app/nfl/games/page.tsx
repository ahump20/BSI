'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * NFL Games Page - Redirects to /nfl/scores
 *
 * All sports use the /scores pattern for live games and results.
 * This redirect handles legacy links and user expectations.
 */
export default function NFLGamesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/nfl/scores');
  }, [router]);

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Redirecting to scores...</p>
      </div>
    </div>
  );
}
