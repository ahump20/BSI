import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: {
    template: '%s | Blaze Sports Intel Models',
    default: 'Models & Methodology | Blaze Sports Intel',
  },
  description:
    'Methodology, win probability, and model-health documentation for Blaze Sports Intel.',
  alternates: { canonical: '/models' },
  openGraph: {
    title: 'Models | Blaze Sports Intel',
    description:
      'Methodology, win probability, and model-health documentation for Blaze Sports Intel.',
    images: ogImage(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Models | Blaze Sports Intel',
    description:
      'Methodology, win probability, and model-health documentation for Blaze Sports Intel.',
  },
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
