import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Mode | Blaze Sports Intel',
  description:
    'Internal developer surfaces for Blaze Sports Intel — feature flags, UE guidance, and experimental labs.'
};

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <div className="di-shell">
      <main className="di-container dev-container">{children}</main>
    </div>
  );
}
