import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'College Baseball Conferences | Blaze Sports Intel',
  description:
    'NCAA Division I baseball conference pages with standings, team rosters, and conference schedules for SEC, Big 12, ACC, and all D1 conferences.',
  alternates: { canonical: '/college-baseball/conferences' },
  openGraph: {
    title: 'College Baseball Conferences | Blaze Sports Intel',
    description:
      'D1 baseball conference standings, advanced metrics, and strength index across every conference.',
    images: ogImage('/images/og-college-baseball.png', 'BSI Conference Hub — College Baseball'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball Conferences | Blaze Sports Intel',
    description:
      'D1 baseball conference standings, advanced metrics, and strength index across every conference.',
    images: ['/images/og-college-baseball.png'],
  },
};

const conferencesJsonLd = {
  '@context': 'https://schema.org' as const,
  '@type': 'CollectionPage' as const,
  name: 'College Baseball Conferences',
  description:
    'NCAA Division I baseball conference hub with standings, advanced metrics, conference strength index, and NIL spend across SEC, ACC, Big 12, Big Ten, and all D1 conferences.',
  url: 'https://blazesportsintel.com/college-baseball/conferences/',
  isPartOf: {
    '@type': 'WebSite' as const,
    name: 'Blaze Sports Intel',
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
    name: 'NCAA Division I Baseball Conferences',
  },
};

export default function CollegeBaseballConferencesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={conferencesJsonLd} />
      {children}
    </>
  );
}
