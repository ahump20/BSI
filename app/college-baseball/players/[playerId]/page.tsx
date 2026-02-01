import PlayerDetailClient from './PlayerDetailClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { playerId } = await params;
  return <PlayerDetailClient />;
}
