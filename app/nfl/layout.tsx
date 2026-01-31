import type { ReactNode } from 'react';

export default function NFLLayout({ children }: { children: ReactNode }) {
  return <div data-sport="nfl">{children}</div>;
}
