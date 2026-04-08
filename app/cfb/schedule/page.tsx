import type { Metadata } from 'next';
import { LegacyRouteBridge } from '@/components/LegacyRouteBridge';

export const metadata: Metadata = {
  title: 'College Football Schedule | Blaze Sports Intel',
  description:
    'The legacy college football schedule route now bridges into live scores and game navigation while keeping the URL healthy for crawlers and shared links.',
  alternates: { canonical: '/cfb/schedule' },
};

export default function CFBSchedulePage() {
  return (
    <LegacyRouteBridge
      eyebrow="College Football"
      title="Schedule Coverage Moved Into Live Scores"
      description="The live schedule flow now runs through the scores experience so kickoff times, status, and game links stay in one lane. This route remains as a stable bridge."
      primaryAction={{ href: '/cfb/scores', label: 'Open Scores & Schedule' }}
      secondaryAction={{ href: '/cfb', label: 'Back to College Football Hub' }}
      note="Visitors keep landing on a full page here instead of a brittle client redirect."
    />
  );
}
