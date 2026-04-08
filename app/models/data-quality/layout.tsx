import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Data Quality & Sources',
  description:
    'How BSI validates data across 3+ providers, cross-reference methodology, API response times, and freshness guarantees.',
  alternates: { canonical: 'https://blazesportsintel.com/models/data-quality' },
  openGraph: {
    title: 'Data Quality & Sources | Blaze Sports Intel',
    description: 'BSI data validation methodology across 3+ providers.',
    images: ogImage(),
  },
};

export default function DataQualityLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
