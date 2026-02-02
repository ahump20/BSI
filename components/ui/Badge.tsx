import { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[#BF5700]/20 text-[#BF5700] border-[#BF5700]/30',
  secondary: 'bg-white/10 text-white/70 border-white/20',
  success: 'bg-green-600/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-600/20 text-red-400 border-red-500/30',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
};

export function Badge({ children, variant = 'primary', size = 'md', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${sizeClasses[size] ?? sizeClasses.md} ${variantClasses[variant] ?? variantClasses.secondary} ${className}`}
    >
      {children}
    </span>
  );
}

export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <Badge variant="success" className={className}>
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1.5" />
      LIVE
    </Badge>
  );
}

interface DataSourceBadgeProps {
  source: string;
  timestamp: string;
  className?: string;
}

export function DataSourceBadge({ source, timestamp, className = '' }: DataSourceBadgeProps) {
  return (
    <div className={`flex items-center gap-2 text-xs text-white/40 ${className}`}>
      <span className="font-medium">{source}</span>
      <span>|</span>
      <span>{timestamp}</span>
    </div>
  );
}
