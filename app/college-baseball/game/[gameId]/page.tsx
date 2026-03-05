import type { Metadata } from 'next';
import CollegeGameSummaryClient from './CollegeGameSummaryClient';

// Force static generation with dynamic params disabled
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
  const title = `Game ${gameId} | College Baseball | Blaze Sports Intel`;
  const description = `College baseball game detail — box score, play-by-play, and live stats on Blaze Sports Intel.`;

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
        name: `College Baseball Game`,
        description,
        url: `https://blazesportsintel.com/college-baseball/game/${gameId}`,
        sport: 'Baseball',
      }),
    },
  };
}

export default function CollegeGameSummaryPage() {
  return <CollegeGameSummaryClient />;
}
