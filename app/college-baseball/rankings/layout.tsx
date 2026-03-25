import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball Rankings | Blaze Sports Intel',
  description: 'NCAA baseball rankings including AP Top 25, coaches poll, and RPI rankings with week-over-week movement.',
  alternates: { canonical: '/college-baseball/rankings' },
  openGraph: {
    title: 'College Baseball Rankings | Blaze Sports Intel',
    description: 'Live D1 college baseball rankings powered by BSI analytics.',
    url: '/college-baseball/rankings',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball Rankings | Blaze Sports Intel',
    description: 'Live D1 college baseball rankings powered by BSI analytics.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
