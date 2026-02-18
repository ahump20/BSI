import type { Metadata } from 'next';
import { IntelligenceClient } from './IntelligenceClient';

export const metadata: Metadata = {
  title: 'Intelligence | Blaze Sports Intel',
  description:
    "Real-time sports analysis powered by Claude Sonnet 4 — streaming AI intelligence on baseball, football, and basketball at the edge.",
  robots: { index: true, follow: true },
};

export default function IntelligencePage() {
  return <IntelligenceClient />;
}
