'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * MLB Games Page - Redirects to /mlb/scores
 *
 * The scores page handles live games, so we redirect there.
 */
export default function MLBGamesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mlb/scores');
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
