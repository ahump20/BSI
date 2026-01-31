/**
// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;
 * MLB Player Detail Page (SSR Wrapper)
 *
 * Server component that handles the dynamic route and delegates to client component.
 *
 * Last Updated: 2025-01-07
 */

import PlayerDetailClient from './PlayerDetailClient';

// Generate static params for static export
// At least one placeholder is needed for static export to recognize the route
export async function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default async function MLBPlayerDetailPage({ params }: PageProps) {
  const { playerId } = await params;

  return <PlayerDetailClient playerId={playerId} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { playerId } = await params;

  return {
    title: `Player ${playerId} | MLB Players | Blaze Sports Intel`,
    description: 'Comprehensive MLB player statistics, advanced metrics, and game logs.',
  };
}
