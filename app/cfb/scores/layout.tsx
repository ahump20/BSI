import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Football Scores | Blaze Sports Intel',
  description: 'Live college football scores with real-time updates across all FBS conferences including SEC, Big 12, Big Ten, and ACC.',
  alternates: { canonical: '/cfb/scores' },
  openGraph: {
    title: 'College Football Scores | Blaze Sports Intel',
    description: 'Live college football scores with real-time updates.',
   images: ogImage('/images/og-cfb.png') },
};

export default function CFBScoresLayout({ children }: { children: ReactNode }) {
  return children;
}
