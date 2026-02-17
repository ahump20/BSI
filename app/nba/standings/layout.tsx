import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBA Standings | BSI',
  description: 'NBA conference standings with win-loss records, winning percentage, games back, and streak data.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
