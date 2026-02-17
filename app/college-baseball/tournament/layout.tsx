import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | College Baseball Tournament HQ',
    default: 'Tournament HQ | BSI College Baseball',
  },
  description:
    'College baseball tournament coverage — bubble watch, regional brackets, and College World Series tracking.',
};

export default function TournamentLayout({ children }: { children: ReactNode }) {
  return <div data-page="tournament">{children}</div>;
}
