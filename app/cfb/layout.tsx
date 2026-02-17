import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Football | BSI',
  description: 'CFB scores, standings, and conference breakdowns.',
  openGraph: { title: 'College Football | BSI', description: 'CFB scores, standings, and conference breakdowns.' },
};

export default function CFBLayout({ children }: { children: ReactNode }) {
  return <div data-sport="cfb">{children}</div>;
}
