import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFL Standings | BSI',
  description: 'NFL division standings for AFC and NFC with win-loss records, points for/against, and playoff positioning.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
