import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4 text-text-muted flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-6', className)} {...props}>
      <ol className="flex items-center gap-2 text-sm flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && <ChevronIcon />}
              {isLast || !item.href ? (
                <span
                  className={cn(isLast ? 'text-text-primary font-medium' : 'text-text-tertiary')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
