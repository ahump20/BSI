import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'hover' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses: Record<string, string> = {
  default: 'bg-white/5 border border-white/10 rounded-xl',
  hover: 'bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 hover:border-white/20 transition-all',
  elevated: 'bg-white/5 border border-white/10 rounded-xl shadow-lg',
};

export function Card({ children, variant = 'default', padding = 'none', className = '' }: CardProps) {
  return (
    <div className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-white/10 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
