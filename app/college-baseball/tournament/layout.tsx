import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | College Baseball Tournament | Blaze Sports Intel',
    default: 'Tournament HQ | Blaze Sports Intel College Baseball',
  },
  description:
    'College baseball tournament coverage — bubble watch, regional brackets, and College World Series tracking.',
  alternates: { canonical: '/college-baseball/tournament' },
  openGraph: {
    title: 'College Baseball Tournament HQ | Blaze Sports Intel',
    description: 'Bubble watch, regional brackets, and College World Series tracking from BSI.',
    url: '/college-baseball/tournament',
    images: [{ url: '/images/og-college-baseball.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball Tournament HQ | Blaze Sports Intel',
    description: 'Bubble watch, regional brackets, and College World Series tracking from BSI.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function TournamentLayout({ children }: { children: ReactNode }) {
  return <div data-page="tournament">{children}</div>;
}
