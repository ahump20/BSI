import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball Editorial | 2026 Season Previews | Blaze Sports Intel',
  description:
    '47 team season previews across the SEC, Big 12, and Big Ten. Conference breakdowns, scouting verdicts, and Omaha projections for every program.',
  openGraph: {
    title: 'College Baseball Editorial | 2026 Season Previews',
    description:
      '47 team season previews across the SEC, Big 12, and Big Ten. Conference breakdowns, scouting verdicts, and Omaha projections.',
  },
};

export default function EditorialLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
