import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ogImage } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import AskClient from './AskClient';

export const metadata: Metadata = {
  title: 'Ask BSI | Blaze Sports Intel',
  description:
    'Ask any sports question and get a real answer. Cross-sport AI concierge powered by live data across college baseball, MLB, NFL, and NBA.',
  openGraph: {
    title: 'Ask BSI | Blaze Sports Intel',
    description:
      'Cross-sport AI concierge. Ask about scores, standings, player stats, and advanced analytics — backed by live BSI data.',
    images: ogImage('/images/og-image.png', 'Ask BSI — AI Sports Concierge'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ask BSI | Blaze Sports Intel',
    description:
      'Ask any sports question and get a real answer — powered by live data across college baseball, MLB, NFL, and NBA.',
    images: ['/images/og-image.png'],
  },
  alternates: { canonical: '/ask' },
};

const askJsonLd = {
  '@context': 'https://schema.org' as const,
  '@type': 'WebApplication' as const,
  name: 'Ask BSI',
  description:
    'Cross-sport AI concierge. Ask about scores, standings, player stats, and advanced analytics — backed by live BSI data across college baseball, MLB, NFL, and NBA.',
  url: 'https://blazesportsintel.com/ask/',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer' as const,
    price: '0',
    priceCurrency: 'USD',
  },
  publisher: {
    '@type': 'Organization' as const,
    name: 'Blaze Sports Intel',
    url: 'https://blazesportsintel.com',
    logo: {
      '@type': 'ImageObject' as const,
      url: 'https://blazesportsintel.com/images/brand/bsi-icon.png',
    },
  },
};

export default function AskPage() {
  return (
    <Suspense>
      <JsonLd data={askJsonLd} />
      <AskClient />
    </Suspense>
  );
}
