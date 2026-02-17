import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB Standings | BSI',
  description: 'Complete AL and NL division standings with win percentage, games back, run differential, and streak data.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
