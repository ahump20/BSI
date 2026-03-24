import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: {
    template: '%s | Blaze Sports Intel Models',
    default: 'Models & Methodology | Blaze Sports Intel',
  },
  description:
    'How BSI builds its analytics models — win probability, Monte Carlo simulations, data quality methodology. Every assumption documented, every input sourced.',
};

export default function ModelsLayout({ children }: { children: ReactNode }) {
  return (
    <div data-page="models">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'BSI Models & Methodology',
          description:
            'Documentation of BSI analytical models, data quality standards, and methodology.',
          publisher: {
            '@type': 'Organization',
            name: 'Blaze Sports Intel',
            url: 'https://blazesportsintel.com',
          },
        }}
      />
      {children}
    </div>
  );
}
