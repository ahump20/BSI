import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Data Sources | Blaze Sports Intel',
  description: 'Transparency page listing all data sources, APIs, and methodology behind BSI analytics including Highlightly, SportsDataIO, and ESPN.',
  alternates: { canonical: '/data-sources' },
  openGraph: {
    title: 'Data Sources | Blaze Sports Intel',
    description: 'BSI data sources and methodology transparency.',
   images: ogImage() },
};

export default function DataSourcesLayout({ children }: { children: ReactNode }) {
  return children;
}
