import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type CardGridProps = {
  children: ReactNode;
  className?: string;
};

export function CardGrid({ children, className }: CardGridProps) {
  return <div className={cn('grid gap-card-gap md:grid-cols-2', className)}>{children}</div>;
}
