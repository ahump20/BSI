import type { ReactNode } from 'react';

export default function NBALayout({ children }: { children: ReactNode }) {
  return <div data-sport="nba">{children}</div>;
}
