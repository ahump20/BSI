import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'College Football | BSI',
  description: 'CFB rankings, scores, transfer portal news, and conference breakdowns. Real-time college football analytics powered by BSI.',
  alternates: { canonical: '/cfb' },
  openGraph: { title: 'College Football | BSI', description: 'CFB scores, standings, and conference breakdowns.' },
};

export default function CFBLayout({ children }: { children: ReactNode }) {
  return (
    <div data-sport="cfb">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
          { '@type': 'ListItem', position: 2, name: 'College Football' },
        ],
      }} />
      {children}
    </div>
  );
}
