import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PageShellProps = {
  children: ReactNode;
  className?: string;
  variant?: 'page' | 'shell';
};

const backgroundByVariant: Record<NonNullable<PageShellProps['variant']>, string> = {
  page: 'bg-di-page',
  shell: 'bg-di-shell'
};

export function PageShell({ children, className, variant = 'page' }: PageShellProps) {
  return (
    <main
      className={cn(
        'min-h-screen bg-di-background px-page-x py-page-y text-di-text',
        backgroundByVariant[variant],
        '[background-repeat:no-repeat]',
        '[background-size:cover]',
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-di-content flex-col gap-section-gap">{children}</div>
    </main>
  );
}
