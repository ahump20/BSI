import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'NBA Teams | Blaze Sports Intel',
  description: 'All 30 NBA teams with rosters, schedules, stats, and analytics across the Eastern and Western Conferences.',
  alternates: { canonical: '/nba/teams' },
  openGraph: {
    title: 'NBA Teams | Blaze Sports Intel',
    description: 'NBA team pages with rosters, schedules, and stats.',
   images: ogImage('/images/og-nba.png') },
};

export default function NBATeamsLayout({ children }: { children: ReactNode }) {
  return children;
}
