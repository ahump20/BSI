import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Arcade | BSI',
  description: 'Browser-based sports games powered by BSI.',
  openGraph: { title: 'Arcade | BSI', description: 'Browser-based sports games powered by BSI.' },
};

export default function ArcadeLayout({ children }: { children: ReactNode }) {
  return (
    <div data-page="arcade">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
          { '@type': 'ListItem', position: 2, name: 'Arcade' },
        ],
      }} />
      {children}
    </div>
  );
}
