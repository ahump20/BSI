import type { ReactNode } from 'react';

export default function MLBLayout({ children }: { children: ReactNode }) {
  return <div data-sport="mlb">{children}</div>;
}
