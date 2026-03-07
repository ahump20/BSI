import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Weekly Brief | Blaze Sports Intel',
  description: 'BSI weekly intelligence briefing with the most important storylines, stats, and analysis across all sports.',
  alternates: { canonical: '/intel/weekly-brief' },
  openGraph: {
    title: 'Weekly Brief | Blaze Sports Intel',
    description: 'Weekly sports intelligence briefing from BSI.',
   images: ogImage() },
};

export default function WeeklyBriefLayout({ children }: { children: ReactNode }) {
  return children;
}
