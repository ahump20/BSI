import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watchlist | College Baseball | BSI',
  description:
    'Track your favorite D1 college baseball players and teams with personalized watchlists and stat alerts.',
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
