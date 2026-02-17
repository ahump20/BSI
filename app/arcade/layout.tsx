import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Arcade | Blaze Sports Intel',
  description: 'Play Blaze Sports Intel arcade games and tools, including football, baseball, basketball, and leadership analytics experiences.',
  alternates: { canonical: '/arcade' },
};

export default function ArcadeLayout({ children }: { children: ReactNode }) {
  return children;
}
