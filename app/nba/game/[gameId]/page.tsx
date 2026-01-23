import GameSummaryClient from './GameSummaryClient';

export function generateStaticParams() {
  return [];
}

export default function NBAGameSummaryPage() {
  return <GameSummaryClient />;
}
