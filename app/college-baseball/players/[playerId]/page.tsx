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

  const title = `${name} | College Baseball Stats & HAV-F Analytics | Blaze Sports Intel`;
  const description = `${name} — college baseball player profile with batting/pitching statistics, HAV-F composite evaluation, and scouting analytics. Data-driven player intelligence from Blaze Sports Intel.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://blazesportsintel.com/college-baseball/players/${playerId}`,
      siteName: 'Blaze Sports Intel',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/college-baseball/players/${playerId}`,
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Person',
            name,
            description: `College baseball player — statistics and HAV-F analytics on Blaze Sports Intel`,
            url: `https://blazesportsintel.com/college-baseball/players/${playerId}`,
          },
          {
            '@type': 'WebPage',
            name: title,
            url: `https://blazesportsintel.com/college-baseball/players/${playerId}`,
            isPartOf: {
              '@type': 'WebSite',
              name: 'Blaze Sports Intel',
              url: 'https://blazesportsintel.com',
            },
            about: {
              '@type': 'Person',
              name,
            },
          },
        ],
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
