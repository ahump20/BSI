/**
 * CFB Player Detail Page (SSR Wrapper)
 */

import PlayerDetailClient from './PlayerDetailClient';

export function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function CFBPlayerDetailPage({ params }: PageProps) {
  const { playerId } = await params;
  return <PlayerDetailClient playerId={playerId} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { playerId } = await params;
  return {
    title: `Player ${playerId} | College Football | Blaze Sports Intel`,
    description: 'Comprehensive college football player statistics and game logs.',
  };
}
