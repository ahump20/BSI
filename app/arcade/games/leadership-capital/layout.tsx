import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leadership Capital Index | BSI Arcade',
  description:
    'Quantify the unquantifiable — 23 intangible leadership metrics mapped to Ulrich LCI, ISO 30431, MLQ 5X, TEIQue, and Antonakis CLT frameworks.',
  openGraph: {
    title: 'Leadership Capital Index | BSI Arcade',
    description:
      'Interactive leadership analytics tool mapping 23 intangible metrics to 5 validated academic frameworks.',
  },
};

export default function LeadershipCapitalLayout({ children }: { children: ReactNode }) {
  return <div data-tool="leadership-capital">{children}</div>;
}
