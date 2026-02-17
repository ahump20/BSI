import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB Live Scores | BSI',
  description: 'Real-time MLB scores and game updates for all 30 teams. Live box scores, line scores, and play-by-play.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
