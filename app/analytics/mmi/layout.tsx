import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Momentum Index (MMI) | Blaze Sports Intel',
  description:
    'Track real-time in-game momentum across college baseball with BSI\'s proprietary Momentum Magnitude Index.',
  openGraph: {
    title: 'Momentum Index (MMI) | Blaze Sports Intel',
    description: 'Real-time in-game momentum tracking for college baseball.',
    images: ogImage(),
  },
};

export default function MMILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
