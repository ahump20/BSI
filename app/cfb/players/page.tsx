import type { Metadata } from 'next';
import { LegacyRouteBridge } from '@/components/LegacyRouteBridge';

export const metadata: Metadata = {
  title: 'College Football Players | Blaze Sports Intel',
  description:
    'The legacy college football players route now points visitors into the current team and roster navigation without losing a clean landing page.',
  alternates: { canonical: '/cfb/players' },
};

export default function CFBPlayersPage() {
  return (
    <LegacyRouteBridge
      eyebrow="College Football"
      title="Player Discovery Now Starts in Team Pages"
      description="BSI’s college football player coverage is organized through team and roster views. This bridge keeps the old players URL alive while sending visitors into the current navigation."
      primaryAction={{ href: '/cfb/teams', label: 'Open Team Directory' }}
      secondaryAction={{ href: '/cfb', label: 'Back to College Football Hub' }}
      note="Legacy route preserved so old links do not degrade into thin redirects or 404s."
    />
  );
}
