import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bubble Watch',
  description: 'Track which college baseball teams are in, out, and on the bubble for the NCAA tournament field.',
};

export default function BubbleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
