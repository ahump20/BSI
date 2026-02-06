import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Football | Blaze Sports Intel',
  description: 'CFB rankings, scores, transfer portal news, and conference breakdowns. Real-time college football analytics powered by BSI.',
  openGraph: { title: 'College Football | Blaze Sports Intel', description: 'CFB rankings, scores, and transfer portal news.' },
};

export default function CFBLayout({ children }: { children: ReactNode }) {
  return <div data-sport="cfb">{children}</div>;
}
