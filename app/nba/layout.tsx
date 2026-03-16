import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

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
    images: ogImage('/images/og-nba.png', 'BSI NBA Coverage'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBA | Blaze Sports Intel',
    description: 'Live NBA scores, standings, and full-league analytics.',
    images: ['/images/og-nba.png'],
  },
  alternates: { canonical: '/nba' },
};

export default function NBALayout({ children }: { children: React.ReactNode }) {
  return children;
}
