import { PlayerDetailClient } from './PlayerDetailClient';

// Static export requires dynamicParams = false; real player IDs resolve
// at runtime via the Worker placeholder fallback pattern.
export const dynamicParams = false;

export async function generateStaticParams() {
  // Placeholder params satisfy static export; real player IDs resolve
  // at runtime via the Worker placeholder fallback pattern.
  return [{ playerId: 'sample-player-1' }, { playerId: 'sample-player-2' }];
}

export default function PlayerDetailPage() {
  return <PlayerDetailClient />;
}
