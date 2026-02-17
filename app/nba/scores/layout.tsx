import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBA Live Scores | BSI',
  description: 'Real-time NBA scores and game updates. Live quarter-by-quarter scoring and box scores.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
