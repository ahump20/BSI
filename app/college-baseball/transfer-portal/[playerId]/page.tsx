import { PlayerDetailClient } from './PlayerDetailClient';

// For static export: only pre-render params from generateStaticParams
export const dynamicParams = false;

export function generateStaticParams() {
  // Sample player IDs for static export
  return [
    { playerId: 'sample-player-1' },
    { playerId: 'sample-player-2' },
  ];
}

export default function PlayerDetailPage() {
  return <PlayerDetailClient />;
}
