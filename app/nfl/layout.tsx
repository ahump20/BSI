import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'NFL Analytics | BSI',
  description: 'Live NFL scores, standings, team rosters, and game stats. Real-time football analytics powered by BSI.',
  alternates: { canonical: '/nfl' },
  openGraph: { title: 'NFL Analytics | BSI', description: 'NFL team stats, standings, and game analysis across all 32 teams.' },
};

export default function NFLLayout({ children }: { children: ReactNode }) {
  return (
    <div data-sport="nfl">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
          { '@type': 'ListItem', position: 2, name: 'NFL' },
        ],
      }} />
      {children}
    </div>
  );
}
