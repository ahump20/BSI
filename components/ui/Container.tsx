import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'narrow' | 'sm' | 'md' | 'lg' | 'wide' | 'xl' | 'full';
  center?: boolean;
}

const sizeClasses: Record<string, string> = {
  narrow: 'max-w-3xl',
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  wide: 'max-w-7xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({ children, className = '', size = 'xl', center }: ContainerProps) {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 w-full ${sizeClasses[size]} ${center ? 'text-center' : ''} ${className}`}>
      {children}
    </div>
  );
}
