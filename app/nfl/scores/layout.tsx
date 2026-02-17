import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFL Live Scores | BSI',
  description: 'Real-time NFL scores, game updates, and weekly results for all 32 teams.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
