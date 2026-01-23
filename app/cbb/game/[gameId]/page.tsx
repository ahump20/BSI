import GameSummaryClient from './GameSummaryClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CBBGameSummaryPage() {
  return <GameSummaryClient />;
}
