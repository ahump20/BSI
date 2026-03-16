import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { SportHubJsonLd } from '@/components/seo/SportHubJsonLd';

export const metadata: Metadata = {
  title: 'MLB | Blaze Sports Intel',
  description:
    'Live scores, standings, and the advanced metrics — wOBA, FIP, wRC+ — that tell you what the box score won\'t.',
  openGraph: {
    title: 'MLB | Blaze Sports Intel',
    description: 'Live MLB scores, standings, and advanced sabermetric analytics.',
    type: 'website',
    url: 'https://blazesportsintel.com/mlb',
    siteName: 'Blaze Sports Intel',
    images: ogImage('/images/og-mlb.png', 'BSI MLB Coverage'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB | Blaze Sports Intel',
    description: 'Live MLB scores, standings, and advanced sabermetric analytics.',
    images: ['/images/og-mlb.png'],
  },
  alternates: { canonical: '/mlb' },
};

export default function MLBLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SportHubJsonLd
        sport="MLB"
        url="/mlb"
        description="Live MLB scores, standings, and advanced sabermetric analytics."
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'MLB', url: '/mlb' },
        ]}
      />
      {children}
    </>
  );
}
