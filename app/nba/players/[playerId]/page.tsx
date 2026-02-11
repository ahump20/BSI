import PlayerProfileClient from './PlayerProfileClient';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function NBAPlayerProfilePage({ params }: PageProps) {
  const { playerId } = await params;
  return <PlayerProfileClient playerId={playerId} />;
}
