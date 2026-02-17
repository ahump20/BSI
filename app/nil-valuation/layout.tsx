import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'NIL Valuation | BSI',
  description: 'College athlete NIL valuation tools and program-level analytics.',
  openGraph: { title: 'NIL Valuation | BSI', description: 'College athlete NIL valuation tools and program-level analytics.' },
};

export default function NILValuationLayout({ children }: { children: ReactNode }) {
  return (
    <div data-sport="nil-valuation">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
          { '@type': 'ListItem', position: 2, name: 'NIL Valuation' },
        ],
      }} />
      {children}
    </div>
  );
}
