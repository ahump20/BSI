import { Suspense } from 'react';
import { PlayerDetailClient } from './PlayerDetailClient';

export default function PlayerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-midnight flex items-center justify-center">
          <div className="animate-pulse text-text-muted">Loading player...</div>
        </div>
      }
    >
      <PlayerDetailClient />
    </Suspense>
  );
}
