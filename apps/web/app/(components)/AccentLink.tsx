import type { ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import { cn } from '../../lib/cn';

type AccentLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
};

export function AccentLink({ children, className, ...props }: AccentLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        'inline-flex items-center gap-inline-gap text-sm font-semibold text-di-accent transition-transform duration-200 hover:translate-x-1 focus-visible:translate-x-1',
        className
      )}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="text-base">
        →
      </span>
    </Link>
  );
}
