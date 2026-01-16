'use client';

import { useState, useMemo } from 'react';

export interface Column {
  /** Unique key matching row data property */
  key: string;
  /** Display label for header */
  label: string;
  /** Optional width class (e.g., "w-24") */
  width?: string;
  /** Optional custom formatter */
  format?: (value: unknown) => string;
}

export interface StatTableProps<T extends Record<string, unknown>> {
  /** Column definitions */
  columns: Column[];
  /** Row data - each row should have an `id` or unique identifier */
  rows: T[];
  /** Enable column sorting (default: false) */
  sortable?: boolean;
  /** Optional className for the container */
  className?: string;
  /** Optional row key field (default: 'id' or index) */
  rowKey?: keyof T;
  /** Optional click handler for rows */
  onRowClick?: (row: T) => void;
  /** Highlight top N rows (e.g., leaders) */
  highlightTop?: number;
}

/**
 * StatTable - Generic sortable data table with frozen first column
 *
 * ESPN-style stat table for box scores, player stats, standings, etc.
 * Features:
 * - Horizontal scroll with frozen first column
 * - Click-to-sort on any column (when sortable=true)
 * - Monospace font for numbers (tabular alignment)
 * - Row hover highlighting
 * - Optional row click handling
 */
export function StatTable<T extends Record<string, unknown>>({
  columns,
  rows,
  sortable = false,
  className = '',
  rowKey,
  onRowClick,
  highlightTop,
}: StatTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (colKey: string) => {
    if (!sortable) return;
    if (sortCol === colKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortCol(colKey);
      setSortDir('desc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];

      // Handle nulls/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
      }

      // String comparison
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [rows, sortCol, sortDir]);

  const getRowKey = (row: T, index: number): string => {
    if (rowKey && row[rowKey] != null) {
      return String(row[rowKey]);
    }
    if ('id' in row && row.id != null) {
      return String(row.id);
    }
    return String(index);
  };

  const formatValue = (col: Column, value: unknown): string => {
    if (value == null) return '-';
    if (col.format) return col.format(value);
    if (typeof value === 'number') {
      // Format percentages and averages nicely
      if (value >= 0 && value <= 1 && col.key.toLowerCase().includes('avg')) {
        return value.toFixed(3).replace(/^0/, '');
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <div className={`overflow-x-auto ${className}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr>
            {columns.map((col, colIndex) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`
                  px-3 py-2 whitespace-nowrap border-b border-gray-700
                  font-display text-[11px] text-gray-400 uppercase font-medium
                  ${colIndex === 0 ? 'text-left sticky left-0 bg-charcoal z-10' : 'text-right'}
                  ${sortable ? 'cursor-pointer hover:text-white transition-colors' : ''}
                  ${col.width || ''}
                `}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortCol === col.key && (
                    <span className="text-burnt-orange">{sortDir === 'desc' ? '↓' : '↑'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, rowIndex) => {
            const isHighlighted = highlightTop && rowIndex < highlightTop;
            return (
              <tr
                key={getRowKey(row, rowIndex)}
                onClick={() => onRowClick?.(row)}
                className={`
                  group transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isHighlighted ? 'bg-burnt-orange/10' : ''}
                  hover:bg-gray-800
                `}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={`
                      px-3 py-2 whitespace-nowrap border-b border-gray-700
                      ${
                        colIndex === 0
                          ? 'text-left sticky left-0 bg-charcoal group-hover:bg-gray-800 z-10 font-medium'
                          : 'text-right'
                      }
                      ${isHighlighted && colIndex === 0 ? 'text-burnt-orange' : ''}
                      ${col.width || ''}
                    `}
                  >
                    {formatValue(col, row[col.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="py-8 text-center text-gray-500 text-sm">No data available</div>
      )}
    </div>
  );
}

export default StatTable;
