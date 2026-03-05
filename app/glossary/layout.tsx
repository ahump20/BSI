import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Glossary | BSI',
  description:
    'Sports analytics glossary — MLB metrics mapped to college equivalents. What each stat means, what data exists, and what BSI can and cannot measure.',
};

export default function GlossaryLayout({ children }: { children: ReactNode }) {
  return <div data-page="glossary">{children}</div>;
}
