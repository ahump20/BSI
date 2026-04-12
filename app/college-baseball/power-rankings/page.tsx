import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import PowerRankingsClient from './PowerRankingsClient';

export const metadata: Metadata = {
  title: 'BSI Power Rankings | College Baseball | Blaze Sports Intel',
  description:
    'Weekly college baseball power rankings computed from BSI Savant sabermetrics — wRC+, FIP, and strength of schedule. Not borrowed. Earned.',
  openGraph: {
    title: 'BSI Power Rankings | College Baseball | Blaze Sports Intel',
    description:
      'Rankings built from the numbers, not the narrative. Weekly power rankings driven by wRC+, FIP, and strength of schedule — not borrowed, earned.',
    images: ogImage('/images/og-college-baseball.png', 'BSI Power Rankings — College Baseball'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BSI Power Rankings | College Baseball | Blaze Sports Intel',
    description:
      'Weekly college baseball power rankings computed from BSI Savant sabermetrics — wRC+, FIP, and strength of schedule.',
    images: ['/images/og-college-baseball.png'],
  },
  alternates: { canonical: '/college-baseball/power-rankings' },
};

const powerRankingsJsonLd = {
  '@context': 'https://schema.org' as const,
  '@type': 'ItemList' as const,
  name: 'BSI Power Rankings — College Baseball',
  description:
    'Weekly college baseball power rankings computed from BSI Savant sabermetrics — wRC+, FIP, and strength of schedule.',
  url: 'https://blazesportsintel.com/college-baseball/power-rankings/',
  numberOfItems: 25,
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  publisher: {
    '@type': 'Organization' as const,
    name: 'Blaze Sports Intel',
    url: 'https://blazesportsintel.com',
  },
};

export default function PowerRankingsPage() {
  return (
    <>
      <JsonLd data={powerRankingsJsonLd} />
      <PowerRankingsClient />
    </>
  );
}
