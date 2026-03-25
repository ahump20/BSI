import type { Metadata } from 'next';
import { LegacyRouteBridge } from '@/components/LegacyRouteBridge';

export const metadata: Metadata = {
  title: 'Historical Analytics | Blaze Sports Intel',
  description:
    'Historical analytics lives inside the BSI models and data-quality hub. Use this route to jump into the current methodology lane.',
  alternates: { canonical: '/analytics/historical' },
};

export default function AnalyticsHistoricalPage() {
  return (
    <LegacyRouteBridge
      eyebrow="Analytics Archive"
      title="Historical Analytics Moved Into the Models Hub"
      description="Historical analysis now sits alongside model-health and data-quality documentation so the methodology, assumptions, and context stay in one place."
      primaryAction={{ href: '/models/data-quality', label: 'Open Data Quality' }}
      secondaryAction={{ href: '/analytics', label: 'Back to Analytics Hub' }}
      note="Legacy route kept live so bookmarks, crawlers, and internal links still land cleanly."
    />
  );
}
