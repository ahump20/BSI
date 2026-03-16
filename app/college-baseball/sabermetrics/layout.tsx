import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sabermetrics | College Baseball | BSI',
  description:
    'Advanced sabermetric analytics for D1 college baseball — wOBA, wRC+, FIP, ERA-, and park-adjusted metrics across 300+ programs.',
  openGraph: {
    title: 'Sabermetrics | College Baseball | BSI',
    description:
      'Park-adjusted advanced metrics for every D1 college baseball program.',
  },
};

export default function SabermetricsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
