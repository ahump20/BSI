'use client';

import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

interface UseTableSortResult<T, K extends string> {
  sorted: T[];
  sortKey: K;
  sortDirection: SortDirection;
  handleSort: (key: K) => void;
  getSortIndicator: (key: K) => '▲' | '▼' | '';
}

/**
 * Generic table sort hook.
 * Supports string and number columns with toggle between asc/desc.
 */
export function useTableSort<T extends Record<string, unknown>, K extends string>(
  data: T[],
  defaultKey: K,
  defaultDirection: SortDirection = 'desc',
): UseTableSortResult<T, K> {
  const [sort, setSort] = useState<SortState<K>>({ key: defaultKey, direction: defaultDirection });

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const aNum = Number(aVal ?? 0);
      const bNum = Number(bVal ?? 0);
      return sort.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [data, sort.key, sort.direction]);

  function handleSort(key: K) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' },
    );
  }

  function getSortIndicator(key: K): '▲' | '▼' | '' {
    if (sort.key !== key) return '';
    return sort.direction === 'asc' ? '▲' : '▼';
  }

  return { sorted, sortKey: sort.key, sortDirection: sort.direction, handleSort, getSortIndicator };
}
