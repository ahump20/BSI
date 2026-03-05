import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Quality & Sources',
  description:
    'How BSI validates data across 3+ providers, cross-reference methodology, API response times, and freshness guarantees.',
  alternates: { canonical: 'https://blazesportsintel.com/models/data-quality' },
};

export default function DataQualityLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
