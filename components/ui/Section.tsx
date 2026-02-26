import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  id?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'charcoal' | 'midnight' | 'cream';
  borderTop?: boolean;
  className?: string;
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'py-6',
  md: 'py-8 md:py-12',
  lg: 'py-12 md:py-16',
  xl: 'py-16 md:py-24',
};

const bgClasses: Record<string, string> = {
  default: '',
  charcoal: 'bg-background-secondary',
  midnight: 'bg-background-primary',
  cream: 'bg-[#FAF8F5]',
};

export function Section({
  children,
  id,
  padding = 'md',
  background = 'default',
  borderTop,
  className = '',
}: SectionProps) {
  return (
    <section
      id={id}
      className={`${paddingClasses[padding]} ${bgClasses[background]} ${borderTop ? 'border-t border-border' : ''} ${className}`}
    >
      {children}
    </section>
  );
}
