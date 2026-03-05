import type { Metadata } from 'next';

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
    images: [{ url: '/images/og-cfb.png', width: 1200, height: 630, alt: 'BSI College Football Coverage' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Football | Blaze Sports Intel',
    description: 'Live college football scores, standings, and conference analytics.',
    images: ['/images/og-cfb.png'],
  },
};

export default function CFBLayout({ children }: { children: React.ReactNode }) {
  return children;
}
