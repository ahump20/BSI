import PlayerProfileClient from './PlayerProfileClient';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array - pages will be generated on-demand at runtime
  // This allows client-side data fetching while satisfying static export requirements
  return [];
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function NFLPlayerProfilePage({ params }: PageProps) {
  const { playerId } = await params;
  return <PlayerProfileClient playerId={playerId} />;
}
