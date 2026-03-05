import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Live Scores | Blaze Sports Intel',
  description: 'Live scores across MLB, NFL, NBA, college baseball, and college football with real-time updates and box score links.',
  alternates: { canonical: '/scores' },
  openGraph: {
    title: 'Live Scores | Blaze Sports Intel',
    description: 'Real-time live scores across all sports.',
  },
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
