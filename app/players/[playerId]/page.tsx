import { Suspense } from 'react';
import { PlayerProfileClient } from './PlayerProfileClient';

// Required for static export - pre-generate sample player pages
export function generateStaticParams() {
  return [
    { playerId: '4429022' }, // Patrick Mahomes (NFL)
    { playerId: '4362887' }, // Quinn Ewers (CFB)
    { playerId: '660271' }, // Shohei Ohtani (MLB)
  ];
}

function PlayerLoading() {
  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-burnt-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-secondary">Loading player profile...</p>
      </div>
    </main>
  );
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;

  return (
    <Suspense fallback={<PlayerLoading />}>
      <PlayerProfileClient playerId={playerId} />
    </Suspense>
  );
}
