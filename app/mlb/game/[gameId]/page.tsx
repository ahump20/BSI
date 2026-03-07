import type { Metadata } from 'next';
import GameSummaryClient from './GameSummaryClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  const title = `Game ${gameId} | MLB | Blaze Sports Intel`;
  const description = `MLB game detail — box score, play-by-play, team stats, and batting/pitching leaders on Blaze Sports Intel.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: 'MLB Game',
        description,
        url: `https://blazesportsintel.com/mlb/game/${gameId}`,
        sport: 'Baseball',
      }),
    },
  };
}

export default function GameSummaryPage() {
  return <GameSummaryClient />;
}
