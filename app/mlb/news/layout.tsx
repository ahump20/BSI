import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB News | Blaze Sports Intel',
  description: 'Latest MLB news, trade rumors, free agency updates, and analysis from Blaze Sports Intel.',
  alternates: { canonical: '/mlb/news' },
  openGraph: {
    title: 'MLB News | Blaze Sports Intel',
    description: 'MLB news, trade rumors, and free agency updates.',
   images: ogImage('/images/og-mlb.png') },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB News | Blaze Sports Intel',
    description: 'MLB news, trade rumors, and free agency updates.',
    images: ['/images/og-mlb.png'],
  },
};

export default function MLBNewsLayout({ children }: { children: ReactNode }) {
  return children;
}
