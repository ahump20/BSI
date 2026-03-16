import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { SportHubJsonLd } from '@/components/seo/SportHubJsonLd';

export const metadata: Metadata = {
  title: 'NFL | Blaze Sports Intel',
  description:
    'Live scores, standings, and team coverage built for the fan who watches past the primetime window.',
  openGraph: {
    title: 'NFL | Blaze Sports Intel',
    description: 'Live NFL scores, standings, and deep team analytics.',
    type: 'website',
    url: 'https://blazesportsintel.com/nfl',
    siteName: 'Blaze Sports Intel',
    images: ogImage('/images/og-nfl.png', 'BSI NFL Coverage'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL | Blaze Sports Intel',
    description: 'Live NFL scores, standings, and deep team analytics.',
    images: ['/images/og-nfl.png'],
  },
  alternates: { canonical: '/nfl' },
};

export default function NFLLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SportHubJsonLd
        sport="NFL"
        url="/nfl"
        description="Live NFL scores, standings, and deep team analytics."
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'NFL', url: '/nfl' },
        ]}
      />
      {children}
    </>
  );
}
