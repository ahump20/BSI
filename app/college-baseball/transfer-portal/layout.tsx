import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Baseball Transfer Portal | Blaze Sports Intel',
  description: 'Track NCAA baseball transfer portal entries with player profiles, previous stats, position, and destination schools.',
  alternates: { canonical: '/college-baseball/transfer-portal' },
  openGraph: {
    title: 'College Baseball Transfer Portal | Blaze Sports Intel',
    description: 'NCAA baseball transfer portal tracker with player stats.',
   images: ogImage('/images/og-college-baseball.png') },
};

export default function CollegeBaseballTransferPortalLayout({ children }: { children: ReactNode }) {
  return children;
}
