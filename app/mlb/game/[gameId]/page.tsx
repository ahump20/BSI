import GameSummaryClient from './GameSummaryClient';
// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array - game pages are client-rendered with dynamic data
  return [{ gameId: 'placeholder' }];
}

export default function GameSummaryPage() {
  return <GameSummaryClient />;
}
