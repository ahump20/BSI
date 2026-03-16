'use client';

interface SortableThProps {
  label: string;
  sortKey: string;
  indicator: '▲' | '▼' | '';
  onSort: (key: string) => void;
  className?: string;
}

/**
 * Table header cell with sort affordance.
 * Heritage styling: burnt-orange indicator, pointer cursor, keyboard accessible.
 */
export function SortableTh({ label, sortKey, indicator, onSort, className = '' }: SortableThProps) {
  return (
    <th
      scope="col"
      className={`text-left p-3 text-text-tertiary font-semibold text-xs cursor-pointer select-none hover:text-burnt-orange transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(sortKey); } }}
      tabIndex={0}
      role="columnheader"
      aria-sort={indicator === '▲' ? 'ascending' : indicator === '▼' ? 'descending' : 'none'}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {indicator && (
          <span className="text-burnt-orange text-[10px]">{indicator}</span>
        )}
      </span>
    </th>
  );
}
