import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import SavantPlayerClient from './SavantPlayerClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  return [{ id: 'placeholder' }];
}

function formatPlayerName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = formatPlayerName(id);

  const title = `${name} | College Baseball Savant Profile | Blaze Sports Intel`;
  const description = `${name} — advanced sabermetric profile with wOBA, FIP, wRC+, percentile bars, and park-adjusted metrics. College Baseball Savant by Blaze Sports Intel.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage('/images/og-college-baseball.png', `${name} — BSI Savant Profile`),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/og-college-baseball.png'],
    },
    alternates: { canonical: `/college-baseball/savant/player/${id}` },
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SavantPlayerPage({ params }: PageProps) {
  const { id } = await params;
  const name = formatPlayerName(id);

  const playerJsonLd = {
    '@context': 'https://schema.org' as const,
    '@type': 'Person' as const,
    name,
    url: `https://blazesportsintel.com/college-baseball/savant/player/${id}/`,
    description: `${name} — advanced sabermetric profile with wOBA, FIP, wRC+, percentile bars, and park-adjusted metrics.`,
    sportsTeam: {
      '@type': 'SportsTeam' as const,
      sport: 'Baseball',
      memberOf: {
        '@type': 'SportsOrganization' as const,
        name: 'NCAA Division I',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage' as const,
      url: `https://blazesportsintel.com/college-baseball/savant/player/${id}/`,
      isPartOf: {
        '@type': 'WebSite' as const,
        name: 'Blaze Sports Intel',
        url: 'https://blazesportsintel.com',
      },
    },
  };

  return (
    <>
      <JsonLd data={playerJsonLd} />
      <SavantPlayerClient />
    </>
  );
}
