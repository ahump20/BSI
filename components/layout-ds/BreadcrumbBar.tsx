'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Minimal breadcrumb bar — shows route segments as links.
 * Hidden on the homepage. Styled with Labs typography tokens.
 */
export function BreadcrumbBar() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="px-4 md:px-6 py-2 border-b border-white/[0.03]"
    >
      <ol className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: 'var(--font-mono)' }}>
        <li>
          <Link href="/" className="text-[var(--bsi-text-dim)] hover:text-[var(--bsi-text-muted)] transition-colors">
            Home
          </Link>
        </li>
        {segments.map((seg, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/');
          const label = seg.replace(/-/g, ' ');
          const isLast = i === segments.length - 1;

          return (
            <li key={href} className="flex items-center gap-1.5">
              <span className="text-[var(--bsi-text-dim)]">/</span>
              {isLast ? (
                <span className="text-[var(--bsi-text-muted)]">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-[var(--bsi-text-dim)] hover:text-[var(--bsi-text-muted)] transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
