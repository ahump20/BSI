import type { Metadata } from 'next';
import { LegacyRouteBridge } from '@/components/LegacyRouteBridge';

export const metadata: Metadata = {
  title: 'Pythagorean Expectation | Blaze Sports Intel',
  description:
    'The legacy Pythagorean route now rolls into the current BSI analytics and model methodology hub.',
  alternates: { canonical: '/analytics/pythagorean' },
};

export default function AnalyticsPythagoreanPage() {
  return (
    <LegacyRouteBridge
      eyebrow="Analytics Methodology"
      title="Pythagorean Expectation Now Routes Through the Current Analytics Stack"
      description="The standalone Pythagorean page has been folded into the broader models workflow so the formula, assumptions, and companion tools stay aligned."
      primaryAction={{ href: '/analytics', label: 'Open Analytics Hub' }}
      secondaryAction={{ href: '/models/win-probability', label: 'Open Win Probability Model' }}
      note="This route remains indexable as a stable bridge instead of dropping visitors onto a dead redirect."
    />
  );
}
