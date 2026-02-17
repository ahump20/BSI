import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arcade | BSI',
  description: 'Browser-based sports games powered by BSI.',
  openGraph: { title: 'Arcade | BSI', description: 'Browser-based sports games powered by BSI.' },
};

export default function ArcadeLayout({ children }: { children: ReactNode }) {
  return <div data-page="arcade">{children}</div>;
}
