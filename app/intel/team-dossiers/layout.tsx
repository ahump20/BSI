import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Dossiers | BSI Intel',
  description: 'In-depth team analysis — identity, game plan, key players, schedule difficulty, and projection.',
  alternates: { canonical: '/intel/team-dossiers' },
  openGraph: {
    title: 'Team Dossiers | Blaze Sports Intel',
    description: 'Team intelligence dossiers and analytical deep dives.',
  },
};

export default function TeamDossiersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
