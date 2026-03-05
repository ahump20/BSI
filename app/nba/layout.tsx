import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBA | Blaze Sports Intel',
  description:
    'Live scores, standings, and game analytics across the full league — not just the coasts.',
  openGraph: {
    title: 'NBA | Blaze Sports Intel',
    description: 'Live NBA scores, standings, and full-league analytics.',
    type: 'website',
    url: 'https://blazesportsintel.com/nba',
    siteName: 'Blaze Sports Intel',
    images: [{ url: '/images/og-nba.png', width: 1200, height: 630, alt: 'BSI NBA Coverage' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBA | Blaze Sports Intel',
    description: 'Live NBA scores, standings, and full-league analytics.',
    images: ['/images/og-nba.png'],
  },
};

export default function NBALayout({ children }: { children: React.ReactNode }) {
  return children;
}
