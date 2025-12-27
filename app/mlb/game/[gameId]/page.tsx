import GameSummaryClient from './GameSummaryClient';

// Generate static params for static export
export function generateStaticParams() {
  // Return empty array - game pages are client-rendered with dynamic data
  return [];
}

export default function GameSummaryPage() {
  return <GameSummaryClient />;
}
