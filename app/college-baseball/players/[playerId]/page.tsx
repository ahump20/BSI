import type { Metadata } from 'next';
import PlayerDetailClient from './PlayerDetailClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ playerId: 'placeholder' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playerId: string }>;
}): Promise<Metadata> {
  const { playerId } = await params;
  const name = playerId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const title = `${name} | College Baseball Player | Blaze Sports Intel`;
  const description = `${name} — college baseball player profile, statistics, and scouting analytics on Blaze Sports Intel.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        description: `College baseball player profile on Blaze Sports Intel`,
        url: `https://blazesportsintel.com/college-baseball/players/${playerId}`,
      }),
    },
  };
}

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { playerId: _playerId } = await params;
  return <PlayerDetailClient />;
}
