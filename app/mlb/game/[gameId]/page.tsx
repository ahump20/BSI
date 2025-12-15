import GameDetailClient from './GameDetailClient';

// Generate static params for static export
// Return placeholder game IDs for build - actual data is fetched client-side
export function generateStaticParams() {
  // Pre-generate a few placeholder paths for build
  // Dynamic routes will be handled client-side
  return [{ gameId: 'placeholder' }];
}

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const { gameId } = await params;
  return <GameDetailClient gameId={gameId} />;
}
