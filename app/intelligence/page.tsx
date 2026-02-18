import type { Metadata } from 'next';
import { IntelligenceClient } from './IntelligenceClient';

export const metadata: Metadata = {
  title: 'Intelligence | Blaze Sports Intel',
  description:
    'Real-time sports analysis powered by Claude Sonnet 4.6 — 40+ curated topics across MLB, NFL, CFB, NBA, college baseball, and CBB. Subscriber analysis injects live BSI data into every response.',
  robots: { index: true, follow: true },
};

export default function IntelligencePage() {
  return <IntelligenceClient />;
}
