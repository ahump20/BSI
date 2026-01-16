'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Vertical padding size */
  padding?: 'none' | 'sm' | 'md' | 'default' | 'lg' | 'xl';
  /** Background variant */
  background?: 'transparent' | 'midnight' | 'charcoal' | 'graphite' | 'gradient';
  /** Add top border */
  borderTop?: boolean;
  /** HTML element to render */
  as?: 'section' | 'div' | 'article' | 'aside';
}

const paddingClasses = {
  none: '',
  sm: 'py-8 md:py-12',
  md: 'py-12 md:py-16',
  default: 'py-16 md:py-24',
  lg: 'py-20 md:py-32',
  xl: 'py-24 md:py-40',
};

const backgroundClasses = {
  transparent: 'bg-transparent',
  midnight: 'bg-midnight',
  charcoal: 'bg-charcoal',
  graphite: 'bg-graphite',
  gradient: 'bg-gradient-to-b from-midnight via-charcoal to-midnight',
};

/**
 * Section component
 * Provides consistent vertical spacing and backgrounds for page sections
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      padding = 'default',
      background = 'transparent',
      borderTop = false,
      as: Component = 'section',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as any}
        className={cn(
          'relative w-full',
          paddingClasses[padding],
          backgroundClasses[background],
          borderTop && 'border-t border-border-subtle',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Section.displayName = 'Section';

export default Section;
