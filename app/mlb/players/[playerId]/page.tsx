import PlayerDetailClient from './PlayerDetailClient';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ playerId: string }>;
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
