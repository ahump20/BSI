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
 * Accessible breadcrumb trail with forward-slash separators.
 * Last item renders as current-page text (non-link, burnt-orange).
 * Ancestor items are links with hover → burnt-orange transition.
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <li key={item.href ?? item.label} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-white/20 select-none" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="text-[#BF5700] font-semibold truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-white/40 hover:text-[#BF5700] transition-colors truncate max-w-[200px]"
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
