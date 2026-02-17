import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB Teams | BSI',
  description: 'All 30 MLB team profiles with rosters, schedules, and statistics across the American and National Leagues.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
