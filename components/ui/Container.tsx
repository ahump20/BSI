import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  size?: 'default' | 'narrow' | 'wide';
  center?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

export function Container({ children, size = 'default', center, className = '' }: ContainerProps) {
  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${center ? 'text-center' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
