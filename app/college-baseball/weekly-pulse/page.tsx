import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import WeeklyPulseClient from './WeeklyPulseClient';

export const metadata: Metadata = {
  title: 'Weekly Pulse | College Baseball | Blaze Sports Intel',
  description:
    'This week in college baseball — top performers, biggest movers, and conference trends. Computed from BSI Savant advanced metrics.',
  openGraph: {
    title: 'Weekly Pulse | College Baseball | Blaze Sports Intel',
    description:
      'BSI computes the week\'s top performers and biggest statistical movers from its own sabermetric engine.',
    images: ogImage('/images/og-college-baseball.png', 'BSI Weekly Pulse — College Baseball'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weekly Pulse | College Baseball | Blaze Sports Intel',
    description:
      'Top performers, biggest movers, and conference trends — computed from BSI Savant advanced metrics.',
    images: ['/images/og-college-baseball.png'],
  },
  alternates: { canonical: '/college-baseball/weekly-pulse' },
};

const weeklyPulseJsonLd = {
  '@context': 'https://schema.org' as const,
  '@type': 'Article' as const,
  headline: 'Weekly Pulse — College Baseball',
  description:
    'This week in college baseball — top performers, biggest movers, and conference trends. Computed from BSI Savant advanced metrics.',
  url: 'https://blazesportsintel.com/college-baseball/weekly-pulse/',
  author: {
    '@type': 'Organization' as const,
    name: 'BSI Analytics Engine',
    url: 'https://blazesportsintel.com',
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
  about: {
    '@type': 'Thing' as const,
    name: 'College Baseball',
  },
  isPartOf: {
    '@type': 'WebSite' as const,
    name: 'Blaze Sports Intel',
    url: 'https://blazesportsintel.com',
  },
};

export default function WeeklyPulsePage() {
  return (
    <>
      <JsonLd data={weeklyPulseJsonLd} />
      <WeeklyPulseClient />
    </>
  );
}
