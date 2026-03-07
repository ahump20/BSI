import type { Metadata } from 'next';
import { WBCPageClient } from '@/components/wbc/WBCPageClient';

export const metadata: Metadata = {
  title: 'World Baseball Classic 2026 | Power Rankings, Pools & Betting Intelligence | BSI',
  description:
    'Full WBC 2026 coverage from Blaze Sports Intel — power rankings (200K simulations), pool breakdowns, tournament bracket, and EdgeBot v3 betting intelligence. March 5–17, Miami Final.',
  openGraph: {
    title: 'WBC 2026 | BSI Tournament Coverage',
    description:
      '20 nations. 4 pools. One title. BSI probability model, EdgeBot v3 analysis, and bracket tracking for the 2026 World Baseball Classic.',
    type: 'website',
    url: 'https://blazesportsintel.com/wbc',
    siteName: 'Blaze Sports Intel',
    images: [{ url: 'https://blazesportsintel.com/images/og-image.png', width: 1200, height: 630, alt: 'WBC 2026 — Blaze Sports Intel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WBC 2026 | BSI Tournament Coverage',
    description:
      '20 nations. 4 pools. One title. BSI probability model, EdgeBot v3 analysis, and bracket tracking.',
    images: ['https://blazesportsintel.com/images/og-image.png'],
  },
};

export default function WBCPage() {
  return <WBCPageClient />;
}
