import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball | Blaze Sports Intel',
  description:
    'Every D1 team. Live scores, box scores, standings, rankings, portal tracking, advanced sabermetrics, and weekly editorial — college baseball covered like it matters.',
  openGraph: {
    title: 'College Baseball | Blaze Sports Intel',
    description:
      'Live scores, standings, rankings, and advanced analytics for every D1 college baseball team.',
    type: 'website',
    url: 'https://blazesportsintel.com/college-baseball',
    siteName: 'Blaze Sports Intel',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630, alt: 'BSI College Baseball' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball | Blaze Sports Intel',
    description: 'Live scores, standings, rankings, and advanced analytics for D1 college baseball.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function CollegeBaseballLayout({ children }: { children: React.ReactNode }) {
  return children;
}
