import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'MLB Analytics | BSI',
  description: 'Live MLB scores, standings, player stats, box scores, and advanced sabermetrics. Real-time baseball analytics powered by BSI.',
  alternates: { canonical: '/mlb' },
  openGraph: { title: 'MLB Analytics | BSI', description: 'Live MLB standings, scores, player stats, and division breakdowns.' },
};

export default function MLBLayout({ children }: { children: ReactNode }) {
  return (
    <div data-sport="mlb">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
          { '@type': 'ListItem', position: 2, name: 'MLB' },
        ],
      }} />
      {children}
    </div>
  );
}
