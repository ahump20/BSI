import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Football Standings | Blaze Sports Intel',
  description: 'College football conference standings with records, conference records, and CFP rankings across all FBS conferences.',
  alternates: { canonical: '/cfb/standings' },
  openGraph: {
    title: 'College Football Standings | Blaze Sports Intel',
    description: 'CFB conference standings and CFP rankings.',
   images: ogImage('/images/og-cfb.png') },
};

export default function CFBStandingsLayout({ children }: { children: ReactNode }) {
  return children;
}
