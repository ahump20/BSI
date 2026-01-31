import { GameDetailClient } from './GameDetailClient';

// Required for static export - pre-generate sample game pages
export function generateStaticParams() {
  const sports = ['cfb', 'nfl', 'mlb', 'cbb', 'college-baseball'];
  const gameIds = ['sample-game-1', 'sample-game-2'];

  return sports.flatMap((sport) => gameIds.map((gameId) => ({ sport, gameId })));
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ sport: string; gameId: string }>;
}) {
  const { sport, gameId } = await params;
  return <GameDetailClient sport={sport} gameId={gameId} />;
}
