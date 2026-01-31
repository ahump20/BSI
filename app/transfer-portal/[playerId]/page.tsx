import { PlayerDetailClient } from './PlayerDetailClient';

export function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

export default function PlayerDetailPage() {
  return <PlayerDetailClient />;
}
