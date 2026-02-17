import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball Live Scores | BSI',
  description: 'Real-time NCAA baseball scores with rank badges, live status indicators, and yesterday fallback.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
