import type { Metadata } from 'next';
import { WBCPageClient } from '@/components/wbc/WBCPageClient';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'World Baseball Classic 2026 — Results & Pre-Tournament Analysis | BSI',
  description:
    'BSI archive coverage of the 2026 World Baseball Classic (March 5–17, Miami). Pre-tournament power rankings (200K simulations), pool breakdowns, and EdgeBot v3 probability model.',
  openGraph: {
    title: 'WBC 2026 Archive | BSI Pre-Tournament Analysis',
    description:
      '20 nations. 4 pools. BSI pre-tournament probability model, pool breakdowns, and bracket analysis. Completed March 17, 2026 — Miami.',
    type: 'website',
    url: 'https://blazesportsintel.com/wbc',
    siteName: 'Blaze Sports Intel',
    images: ogImage(
      'https://blazesportsintel.com/images/og-image.png',
      'WBC 2026 Archive — Blaze Sports Intel'
    ),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WBC 2026 Archive | BSI Pre-Tournament Analysis',
    description:
      '20 nations. 4 pools. BSI pre-tournament probability model and bracket tracking. Completed March 17, 2026.',
    images: ['https://blazesportsintel.com/images/og-image.png'],
  },
};

export default function WBCPage() {
  return <WBCPageClient />;
}
