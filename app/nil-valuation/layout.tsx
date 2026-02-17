import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NIL Valuation | BSI',
  description: 'College athlete NIL valuation tools and program-level analytics.',
  openGraph: { title: 'NIL Valuation | BSI', description: 'College athlete NIL valuation tools and program-level analytics.' },
};

export default function NILValuationLayout({ children }: { children: ReactNode }) {
  return <div data-sport="nil-valuation">{children}</div>;
}
