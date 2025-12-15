'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Max width variant */
  size?: 'sm' | 'md' | 'default' | 'wide' | 'full';
  /** Remove horizontal padding */
  noPadding?: boolean;
  /** Center content */
  center?: boolean;
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  default: 'max-w-[1200px]',
  wide: 'max-w-[1400px]',
  full: 'max-w-[1920px]',
};

/**
 * Container component
 * Provides consistent max-width and horizontal padding across pages
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'default', noPadding = false, center = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full mx-auto',
          sizeClasses[size],
          !noPadding && 'px-4 sm:px-6 lg:px-8',
          center && 'flex flex-col items-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export default Container;
