import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NIL Valuation | Blaze Sports Intel',
  description: 'Track and evaluate athlete NIL value with data-backed insights, market context, and transparent methodology from Blaze Sports Intel.',
  alternates: { canonical: '/nil-valuation' },
};

const nilDatasetJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Blaze Sports Intel NIL Valuation Dataset',
  description:
    'NIL valuation intelligence covering athlete market indicators, valuation signals, and sport-specific sponsorship context.',
  creator: {
    '@type': 'Organization',
    name: 'Blaze Sports Intel',
    url: 'https://blazesportsintel.com',
  },
  url: 'https://blazesportsintel.com/nil-valuation',
};

export default function NILValuationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(nilDatasetJsonLd) }}
      />
      {children}
    </>
  );
}
