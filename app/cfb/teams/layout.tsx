import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teams | College Football | BSI',
  description:
    'All 134 FBS college football teams — rosters, schedules, and statistics across every conference.',
  openGraph: {
    title: 'Teams | College Football | BSI',
    description: 'Browse all 134 FBS college football programs.',
  },
};

export default function CFBTeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
