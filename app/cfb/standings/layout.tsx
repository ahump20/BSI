import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Football Standings | Blaze Sports Intel',
  description: 'College football conference standings with records, conference records, and CFP rankings across all FBS conferences.',
  alternates: { canonical: '/cfb/standings' },
  openGraph: {
    title: 'College Football Standings | Blaze Sports Intel',
    description: 'CFB conference standings and CFP rankings.',
  },
};

export default function CFBStandingsLayout({ children }: { children: ReactNode }) {
  return children;
}
