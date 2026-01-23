import GameSummaryClient from './GameSummaryClient';

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export default function CFBGameSummaryPage() {
  return <GameSummaryClient />;
}
