import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College World Series Projected Field | BSI',
  description:
    'Live projected CWS seeds and bracket based on current D1 baseball rankings. Updated in real-time during the season.',
  openGraph: {
    title: 'College World Series Projected Field | BSI',
    description:
      'Live projected CWS seeds and bracket based on current D1 baseball rankings.',
    images: ogImage('/images/og-college-baseball.png'),
  },
};

export default function CWSLayout({ children }: { children: React.ReactNode }) {
  return children;
}
