'use client';

import { clsx } from 'clsx';

interface ToggleGroupProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
  accentColor?: string;
}

export function ToggleGroup<T extends string>({
  value,
  onValueChange,
  options,
  className,
  accentColor = 'var(--bsi-primary, #BF5700)',
}: ToggleGroupProps<T>) {
  return (
    <div
      className={clsx('inline-flex gap-1 rounded-lg p-1 bg-surface-light border border-border', className)}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(opt.value)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] transition-all',
              active ? 'border shadow-sm' : 'text-text-muted hover:text-text-secondary border border-transparent',
            )}
            style={
              active
                ? {
                    color: accentColor,
                    borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
                    background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                  }
                : undefined
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
