import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Live Scores | BSI',
  description: 'Cross-sport live scoreboard.',
  openGraph: { title: 'Live Scores | BSI', description: 'Cross-sport live scoreboard.' },
};

export default function ScoresLayout({ children }: { children: ReactNode }) {
  return (
    <div data-page="scores">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
          { '@type': 'ListItem', position: 2, name: 'Live Scores' },
        ],
      }} />
      {children}
    </div>
  );
}
