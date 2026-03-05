'use client';

import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

export function ScrollArea({ children, className, maxHeight = '420px' }: ScrollAreaProps) {
  return (
    <div
      className={clsx('overflow-y-auto overflow-x-hidden', className)}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
}
