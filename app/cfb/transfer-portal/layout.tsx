import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Football Transfer Portal | Blaze Sports Intel',
  description: 'Track college football transfer portal entries with player profiles, stats, star ratings, and destination schools.',
  alternates: { canonical: '/cfb/transfer-portal' },
  openGraph: {
    title: 'College Football Transfer Portal | Blaze Sports Intel',
    description: 'CFB transfer portal tracker with player profiles.',
   images: ogImage('/images/og-cfb.png') },
};

export default function CFBTransferPortalLayout({ children }: { children: ReactNode }) {
  return children;
}
