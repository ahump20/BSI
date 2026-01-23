import GameSummaryClient from './GameSummaryClient';

export function generateStaticParams() {
  return [];
}

export default function NFLGameSummaryPage() {
  return <GameSummaryClient />;
}
