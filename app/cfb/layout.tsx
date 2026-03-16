import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { SportHubJsonLd } from '@/components/seo/SportHubJsonLd';

export const metadata: Metadata = {
  title: 'College Football | Blaze Sports Intel',
  description:
    'Scores, standings, and conference coverage from the Big 12 to the Sun Belt.',
  openGraph: {
    title: 'College Football | Blaze Sports Intel',
    description: 'Live college football scores, standings, and conference analytics.',
    type: 'website',
    url: 'https://blazesportsintel.com/cfb',
    siteName: 'Blaze Sports Intel',
    images: ogImage('/images/og-cfb.png', 'BSI College Football Coverage'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Football | Blaze Sports Intel',
    description: 'Live college football scores, standings, and conference analytics.',
    images: ['/images/og-cfb.png'],
  },
  alternates: { canonical: '/cfb' },
};

export default function CFBLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SportHubJsonLd
        sport="College Football"
        url="/cfb"
        description="Live college football scores, standings, and conference analytics."
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'College Football', url: '/cfb' },
        ]}
      />
      {children}
    </>
  );
}
