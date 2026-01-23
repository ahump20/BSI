/**
 * NFL Player Detail Page (SSR Wrapper)
 *
 * Server component that handles the dynamic route and delegates to client component.
 */

import PlayerDetailClient from './PlayerDetailClient';

export function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default async function NFLPlayerDetailPage({ params }: PageProps) {
  const { playerId } = await params;

  return <PlayerDetailClient playerId={playerId} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { playerId } = await params;

  return {
    title: `Player ${playerId} | NFL Players | Blaze Sports Intel`,
    description: 'Comprehensive NFL player statistics, game logs, and career stats.',
  };
}
