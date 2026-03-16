import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trends | College Baseball | BSI',
  description:
    'Trending players, teams, and stats in D1 college baseball — who is rising, who is falling, and what the numbers say.',
};

export default function TrendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
