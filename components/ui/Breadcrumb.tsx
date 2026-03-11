'use client';

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Accessible breadcrumb trail.
 * - JetBrains Mono, 10px, uppercase, wider tracking
 * - Links: burnt-orange (#BF5700)
 * - Current page: rgba(245,240,235,0.4)
 * - Separator: › in rgba(245,240,235,0.2)
 * - No link on last item
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className="flex items-center flex-wrap gap-1.5"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <li key={item.href ?? item.label} className="flex items-center gap-1.5">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{ color: 'rgba(245,240,235,0.2)' }}
                >
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current="page"
                  style={{ color: 'rgba(245,240,235,0.4)' }}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:opacity-80"
                  style={{ color: '#BF5700' }}
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
