/**
 * DataTable Component
 * Reusable table with pagination, search, and sort
 */

'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  loading?: boolean;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination = true,
  searchable = false,
  sortable = true,
  loading = false,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  if (loading) {
    return (
      <div className="bg-charcoal rounded-lg p-8 text-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-charcoal border border-text-tertiary/20 rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-burnt-orange"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-charcoal border-b border-text-tertiary/20">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  className={clsx(
                    'px-4 py-3 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider',
                    column.sortable !== false && sortable && 'cursor-pointer hover:text-burnt-orange'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {sortConfig?.key === column.key && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-text-tertiary/10 hover:bg-charcoal/50 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-white">
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-charcoal text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-burnt-orange transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-charcoal text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-burnt-orange transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
