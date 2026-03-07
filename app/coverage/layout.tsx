import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Coverage Map | Blaze Sports Intel',
  description: 'BSI coverage map showing sport-by-sport data availability, feature status, and real-time data freshness across MLB, NFL, NBA, and NCAA.',
  alternates: { canonical: '/coverage' },
  openGraph: {
    title: 'Coverage Map | Blaze Sports Intel',
    description: 'BSI sport coverage and data availability.',
   images: ogImage() },
};

export default function CoverageLayout({ children }: { children: ReactNode }) {
  return children;
}
