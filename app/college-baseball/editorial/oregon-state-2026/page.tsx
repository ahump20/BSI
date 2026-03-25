import type { Metadata } from 'next';
import { LegacyRouteBridge } from '@/components/LegacyRouteBridge';

export const metadata: Metadata = {
  title: 'Oregon State 2026 Preview | Blaze Sports Intel',
  description:
    'This legacy Oregon State preview URL now bridges cleanly into the current Oregon program preview lane.',
  alternates: { canonical: '/college-baseball/editorial/oregon-state-2026' },
};

export default function OregonState2026Page() {
  return (
    <LegacyRouteBridge
      eyebrow="College Baseball Editorial"
      title="Oregon State Preview Folded Into the Current Oregon Lane"
      description="The archived Oregon State preview route now points readers to the active Oregon program preview instead of dropping them onto a dead redirect."
      primaryAction={{
        href: '/college-baseball/editorial/oregon-2026',
        label: 'Open Oregon 2026 Preview',
      }}
      secondaryAction={{
        href: '/college-baseball/editorial',
        label: 'Open Editorial Hub',
      }}
      note="Legacy editorial URLs stay reachable so older shares and sitemap entries do not break."
    />
  );
}
