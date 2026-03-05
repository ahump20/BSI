import { clsx } from 'clsx';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  accent?: boolean;
  className?: string;
}

export function Separator({ orientation = 'horizontal', accent = false, className }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={clsx(
        orientation === 'horizontal' ? 'divider' : 'w-px h-full bg-border',
        accent && 'divider-accent',
        className,
      )}
    />
  );
}
