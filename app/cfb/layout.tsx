import type { ReactNode } from 'react';

export default function CFBLayout({ children }: { children: ReactNode }) {
  return <div data-sport="cfb">{children}</div>;
}
