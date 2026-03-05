import type { Metadata } from 'next';

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
    images: [{ url: '/images/og-nfl.png', width: 1200, height: 630, alt: 'BSI NFL Coverage' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL | Blaze Sports Intel',
    description: 'Live NFL scores, standings, and deep team analytics.',
    images: ['/images/og-nfl.png'],
  },
};

export default function NFLLayout({ children }: { children: React.ReactNode }) {
  return children;
}
