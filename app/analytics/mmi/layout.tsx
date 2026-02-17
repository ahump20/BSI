import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Momentum Index (MMI) | Blaze Sports Intel',
  description:
    'Track real-time in-game momentum across college baseball with BSI\'s proprietary Momentum Magnitude Index.',
};

export default function MMILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
