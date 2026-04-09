import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import PowerRankingsClient from './PowerRankingsClient';

export const metadata: Metadata = {
  title: 'MLB Power Index | Blaze Sports Intel',
  description:
    'BSI MLB Power Index blends actual record, pythagorean expectation, and run differential into a single early-season composite score. Not borrowed from ESPN. Computed from live data.',
  openGraph: {
    title: 'MLB Power Index | Blaze Sports Intel',
    description:
      'Composite power rankings for all 30 MLB teams. 50% actual win percentage, 30% pythagorean expectation, 20% run differential.',
    images: ogImage('/images/og-mlb.png', 'BSI MLB Power Index'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB Power Index | Blaze Sports Intel',
    description:
      'BSI MLB Power Index — composite rankings for all 30 teams, built from actual results, pythagorean expectation, and run differential.',
    images: ['/images/og-mlb.png'],
  },
  alternates: { canonical: '/mlb/power-rankings' },
};

const powerRankingsJsonLd = {
  '@context': 'https://schema.org' as const,
  '@type': 'ItemList' as const,
  name: 'BSI MLB Power Index',
  description:
    'Composite power rankings for all 30 MLB teams blending actual record, pythagorean expectation, and run differential.',
  url: 'https://blazesportsintel.com/mlb/power-rankings/',
  numberOfItems: 30,
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  publisher: {
    '@type': 'Organization' as const,
    name: 'Blaze Sports Intel',
    url: 'https://blazesportsintel.com',
  },
};

export default function MLBPowerRankingsPage() {
  return (
    <>
      <JsonLd data={powerRankingsJsonLd} />
      <PowerRankingsClient />
    </>
  );
}
