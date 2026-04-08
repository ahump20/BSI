import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBA Playoff Picture | Blaze Sports Intel',
  description:
    'Live NBA playoff seedings, play-in tournament matchups, and clinch scenarios for both conferences. Updated with every game.',
  openGraph: {
    title: 'NBA Playoff Picture | Blaze Sports Intel',
    description:
      'Live NBA playoff seedings, play-in tournament matchups, and clinch scenarios.',
    type: 'website',
    url: 'https://blazesportsintel.com/nba/playoff-picture',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBA Playoff Picture | Blaze Sports Intel',
    description: 'Live NBA playoff seedings, play-in matchups, and clinch scenarios.',
  },
  alternates: { canonical: '/nba/playoff-picture' },
};

export default function PlayoffPictureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
