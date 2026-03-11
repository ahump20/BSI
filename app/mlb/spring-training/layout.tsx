import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB Spring Training | BSI',
  description:
    'Live spring training scores, standings, and rosters for Cactus League and Grapefruit League. Track every MLB team through camp.',
  alternates: { canonical: '/mlb/spring-training' },
  openGraph: {
    title: 'MLB Spring Training | BSI',
    description:
      'Cactus & Grapefruit League scores, standings, and roster tracking.',
   images: ogImage('/images/og-mlb.png') },
};

export default function SpringTrainingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
            { '@type': 'ListItem', position: 2, name: 'MLB', item: 'https://blazesportsintel.com/mlb' },
            { '@type': 'ListItem', position: 3, name: 'Spring Training' },
          ],
        }}
      />
      {children}
    </>
  );
}
