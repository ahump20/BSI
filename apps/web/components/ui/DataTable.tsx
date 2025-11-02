/**
 * Enhanced DataTable Component
 *
 * Feature-rich data table with sorting, filtering, and pagination.
 * Simple usage: <DataTable data={rows} columns={columns} />
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useDebounce, useStaggerChildren } from '@/lib/graphics/hooks';

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  pageSize?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  animate?: boolean;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
  showSearch = true,
  showPagination = true,
  striped = true,
  hoverable = true,
  compact = false,
  stickyHeader = false,
  animate = true,
  className = '',
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const tableBodyRef = useStaggerChildren(30);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;

    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(debouncedSearch.toLowerCase());
      })
    );
  }, [data, debouncedSearch, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <div className={`data-table ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="data-table-search">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="data-table-search-input"
          />
        </div>
      )}

      {/* Table */}
      <div className={`data-table-wrapper ${stickyHeader ? 'sticky-header' : ''}`}>
        <table className={`data-table-table ${compact ? 'compact' : ''}`}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    width: column.width,
                    textAlign: column.align || 'left',
                  }}
                  className={column.sortable ? 'sortable' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="data-table-header-content">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="sort-indicator">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? ' ↑' : sortDirection === 'desc' ? ' ↓' : ' ⇅'
                        ) : (
                          ' ⇅'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={tableBodyRef as React.RefObject<HTMLTableSectionElement>}>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`
                    ${striped && rowIndex % 2 === 0 ? 'striped' : ''}
                    ${hoverable ? 'hoverable' : ''}
                    ${onRowClick ? 'clickable' : ''}
                  `}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {columns.map((column) => {
                    const value = row[column.key];
                    const renderedValue = column.render
                      ? column.render(value, row, rowIndex)
                      : value;

                    return (
                      <td
                        key={column.key}
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {renderedValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="empty-message">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Previous
            </button>
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis between non-consecutive pages
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="pagination-ellipsis">...</span>}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`pagination-button ${
                          page === currentPage ? 'active' : ''
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
