import type { ReactNode } from 'react';

export default function CollegeBaseballLayout({ children }: { children: ReactNode }) {
  return <div data-sport="college-baseball">{children}</div>;
}
