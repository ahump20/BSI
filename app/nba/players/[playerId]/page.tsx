/**
 * NBA Player Detail Page (SSR Wrapper)
 */

import PlayerDetailClient from './PlayerDetailClient';

export function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function NBAPlayerDetailPage({ params }: PageProps) {
  const { playerId } = await params;
  return <PlayerDetailClient playerId={playerId} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { playerId } = await params;
  return {
    title: `Player ${playerId} | NBA Players | Blaze Sports Intel`,
    description: 'Comprehensive NBA player statistics, game logs, and career stats.',
  };
}
