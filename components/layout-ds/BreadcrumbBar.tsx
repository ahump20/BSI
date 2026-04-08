'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

/* ========================================================================== */
/* SEGMENT → LABEL overrides for cleaner breadcrumbs                           */
/* ========================================================================== */

const SEGMENT_LABELS: Record<string, string> = {
  'college-baseball': 'College Baseball',
  'college-football': 'College Football',
  'blog-post-feed': 'Blog',
  'nil-valuation': 'NIL Valuation',
  'transfer-portal': 'Transfer Portal',
  'diamond-dynasty': 'Diamond Dynasty',
  'the-show-26': 'The Show 26',
  'data-quality': 'Data Quality',
  'data-sources': 'Data Sources',
  'vision-ai': 'Vision AI',
  'performance-index': 'Performance Index',
  cfb: 'College Football',
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  wbc: 'WBC',
  mmi: 'MMI',
  havf: 'HAV-F',
  intel: 'Intel',
  savant: 'Savant',
};

function segmentLabel(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
  // Capitalize each word from kebab-case
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ========================================================================== */
/* COMPONENT                                                                   */
/* ========================================================================== */

/**
 * Minimal breadcrumb bar — shows route segments as links.
 * Hidden on the homepage. Uses Heritage Design System tokens.
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
      <ol className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] font-mono">
        <li>
          <Link href="/" className="text-text-muted hover:text-bsi-dust transition-colors">
            Home
          </Link>
        </li>
        {segments.map((seg, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/');
          const label = segmentLabel(seg);
          const isLast = i === segments.length - 1;

          return (
            <li key={href} className="flex items-center gap-1.5">
              <span className="text-text-muted">/</span>
              {isLast ? (
                <span className="text-bsi-dust">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-text-muted hover:text-bsi-dust transition-colors"
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
