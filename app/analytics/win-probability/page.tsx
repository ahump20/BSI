import type { Metadata } from 'next';
import { LegacyRouteBridge } from '@/components/LegacyRouteBridge';

export const metadata: Metadata = {
  title: 'Win Probability | Blaze Sports Intel',
  description:
    'Use the live BSI win-probability model route from this legacy analytics URL without losing metadata or crawl coverage.',
  alternates: { canonical: '/analytics/win-probability' },
};

export default function AnalyticsWinProbabilityPage() {
  return (
    <LegacyRouteBridge
      eyebrow="Live Model"
      title="Win Probability Lives in the Models Hub"
      description="The live win-probability workflow now sits under BSI models so the methodology and output stay together. This route remains in place for continuity."
      primaryAction={{ href: '/models/win-probability', label: 'Open Win Probability' }}
      secondaryAction={{ href: '/analytics', label: 'Back to Analytics Hub' }}
      note="Legacy route retained for search, shared links, and older internal references."
    />
  );
}
