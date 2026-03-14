import type { Metadata } from 'next';
import { GlossaryPageClient } from './GlossaryPageClient';

export const metadata: Metadata = {
  title: 'Sabermetrics Glossary | College Baseball Savant | BSI',
  description:
    'Plain-English definitions for every advanced metric on BSI Savant — wOBA, wRC+, FIP, ERA-, ISO, park factors, conference strength index, and more.',
  alternates: { canonical: '/college-baseball/savant/glossary' },
  openGraph: {
    title: 'Sabermetrics Glossary | College Baseball Savant',
    description:
      'Plain-English definitions for wOBA, wRC+, FIP, ERA-, ISO, park factors, conference strength, and every metric on BSI Savant.',
  },
};

export default function GlossaryPage() {
  return <GlossaryPageClient />;
}
