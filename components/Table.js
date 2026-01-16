/**
 * Blaze Sports Intel Design System - Table Component
 *
 * Usage:
 *   import { Table } from './components/Table.js';
 *
 *   const table = Table({
 *     caption: 'MLB Standings 2025',
 *     columns: [
 *       { key: 'team', label: 'Team', sortable: true },
 *       { key: 'wins', label: 'W', sortable: true, align: 'right' },
 *       { key: 'losses', label: 'L', sortable: true, align: 'right' }
 *     ],
 *     data: [
 *       { team: 'Cardinals', wins: 92, losses: 70 },
 *       { team: 'Cubs', wins: 85, losses: 77 }
 *     ],
 *     variant: 'striped'
 *   });
 *
 *   document.body.appendChild(table);
 *
 * @param {Object} options - Table configuration
 * @param {string} [options.caption] - Table caption for accessibility
 * @param {Array} options.columns - Column definitions
 * @param {Array} options.data - Row data
 * @param {string} [options.variant='default'] - Table variant: default, striped, bordered
 * @param {boolean} [options.compact=false] - Compact spacing
 * @param {boolean} [options.sticky=false] - Sticky header
 * @param {boolean} [options.responsive=true] - Enable responsive overflow
 * @param {Function} [options.onSort] - Sort callback (column, direction)
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Table wrapper element
 */
export function Table(options = {}) {
  const {
    caption = null,
    columns = [],
    data = [],
    variant = 'default',
    compact = false,
    sticky = false,
    responsive = true,
    onSort = null,
    className = '',
  } = options;

  // State for sorting
  let sortColumn = null;
  let sortDirection = 'asc';

  // Create wrapper (for responsive scrolling)
  const wrapper = document.createElement('div');
  wrapper.className =
    `bsi-table-wrapper ${responsive ? 'bsi-table-wrapper--responsive' : ''} ${className}`.trim();

  // Create table
  const table = document.createElement('table');
  table.className = `bsi-table bsi-table--${variant} ${compact ? 'bsi-table--compact' : ''} ${
    sticky ? 'bsi-table--sticky' : ''
  }`.trim();
  table.setAttribute('role', 'table');

  // Add caption if provided
  if (caption) {
    const captionElement = document.createElement('caption');
    captionElement.className = 'bsi-table__caption';
    captionElement.textContent = caption;
    table.appendChild(captionElement);
  }

  // Create thead
  const thead = document.createElement('thead');
  thead.className = 'bsi-table__thead';
  const headerRow = document.createElement('tr');
  headerRow.className = 'bsi-table__row';

  columns.forEach((column) => {
    const th = document.createElement('th');
    th.className = `bsi-table__th ${column.align ? `bsi-table__th--${column.align}` : ''}`.trim();
    th.setAttribute('scope', 'col');
    th.setAttribute('role', 'columnheader');

    if (column.sortable) {
      th.classList.add('bsi-table__th--sortable');
      th.setAttribute('tabindex', '0');
      th.setAttribute('aria-sort', 'none');

      // Create sortable header content
      const content = document.createElement('div');
      content.className = 'bsi-table__th-content';

      const label = document.createElement('span');
      label.textContent = column.label;
      content.appendChild(label);

      const icon = document.createElement('span');
      icon.className = 'bsi-table__sort-icon';
      icon.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2L9 6H3L6 2Z" fill="currentColor" opacity="0.3"/>
          <path d="M6 10L3 6H9L6 10Z" fill="currentColor" opacity="0.3"/>
        </svg>
      `;
      content.appendChild(icon);

      th.appendChild(content);

      // Handle sort
      const handleSort = () => {
        // Update sort state
        if (sortColumn === column.key) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortColumn = column.key;
          sortDirection = 'asc';
        }

        // Update ARIA
        columns.forEach((col) => {
          const colTh = headerRow.querySelector(`[data-column="${col.key}"]`);
          if (colTh) {
            if (col.key === sortColumn) {
              colTh.setAttribute('aria-sort', sortDirection === 'asc' ? 'ascending' : 'descending');
              colTh.classList.add('bsi-table__th--sorted');
              colTh.classList.toggle('bsi-table__th--asc', sortDirection === 'asc');
              colTh.classList.toggle('bsi-table__th--desc', sortDirection === 'desc');
            } else {
              colTh.setAttribute('aria-sort', 'none');
              colTh.classList.remove(
                'bsi-table__th--sorted',
                'bsi-table__th--asc',
                'bsi-table__th--desc'
              );
            }
          }
        });

        // Call sort callback
        if (onSort && typeof onSort === 'function') {
          onSort(sortColumn, sortDirection);
        } else {
          // Default sort implementation
          renderTableBody();
        }
      };

      th.addEventListener('click', handleSort);
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort();
        }
      });

      th.setAttribute('data-column', column.key);
    } else {
      th.textContent = column.label;
    }

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create tbody
  const tbody = document.createElement('tbody');
  tbody.className = 'bsi-table__tbody';
  table.appendChild(tbody);

  // Function to render table body
  function renderTableBody() {
    // Clear existing rows
    tbody.innerHTML = '';

    // Sort data if needed
    const sortedData = [...data];
    if (sortColumn) {
      sortedData.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Render rows
    sortedData.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.className = 'bsi-table__row';
      tr.setAttribute('role', 'row');

      columns.forEach((column) => {
        const td = document.createElement('td');
        td.className =
          `bsi-table__td ${column.align ? `bsi-table__td--${column.align}` : ''}`.trim();
        td.setAttribute('role', 'cell');

        // Handle custom cell renderer
        if (column.render && typeof column.render === 'function') {
          const content = column.render(row[column.key], row, rowIndex);
          if (typeof content === 'string') {
            td.innerHTML = content;
          } else if (content instanceof HTMLElement) {
            td.appendChild(content);
          }
        } else {
          td.textContent = row[column.key] ?? '';
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  // Initial render
  renderTableBody();

  wrapper.appendChild(table);
  return wrapper;
}

/**
 * Table Styles
 * Import this CSS into your stylesheet or add to <head>
 */
export const TableStyles = `
<style>
/* ===== TABLE WRAPPER ===== */
.bsi-table-wrapper {
  width: 100%;
  overflow: visible;
}

.bsi-table-wrapper--responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ===== BASE TABLE STYLES ===== */
.bsi-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  font-family: var(--font-family-sans, system-ui, sans-serif);
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-primary, #FFFFFF);
}

/* ===== TABLE CAPTION ===== */
.bsi-table__caption {
  padding: var(--spacing-4, 1rem);
  font-size: var(--font-size-base, 1rem);
  font-weight: var(--font-weight-semibold, 600);
  text-align: left;
  caption-side: top;
  color: var(--color-text-primary, #FFFFFF);
}

/* ===== TABLE HEAD ===== */
.bsi-table__thead {
  background: var(--color-bg-secondary, #2A2A2A);
  border-bottom: 2px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
}

.bsi-table--sticky .bsi-table__thead {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky, 1010);
}

.bsi-table__th {
  padding: var(--spacing-4, 1rem) var(--spacing-3, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  text-align: left;
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider, 0.05em);
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.85));
  white-space: nowrap;
  user-select: none;
}

.bsi-table__th--left { text-align: left; }
.bsi-table__th--center { text-align: center; }
.bsi-table__th--right { text-align: right; }

/* ===== SORTABLE HEADERS ===== */
.bsi-table__th--sortable {
  cursor: pointer;
  transition: background-color var(--transition-timing-fast, 150ms) var(--transition-easing-ease-out, ease-out);
}

.bsi-table__th--sortable:hover {
  background: var(--color-bg-tertiary, #3A3A3A);
}

.bsi-table__th--sortable:focus-visible {
  outline: 2px solid var(--color-border-focus, #BF5700);
  outline-offset: -2px;
}

.bsi-table__th-content {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2, 0.5rem);
}

.bsi-table__sort-icon {
  display: inline-flex;
  opacity: 0.5;
  transition: opacity var(--transition-timing-fast, 150ms);
}

.bsi-table__th--sortable:hover .bsi-table__sort-icon {
  opacity: 1;
}

.bsi-table__th--sorted .bsi-table__sort-icon {
  opacity: 1;
}

.bsi-table__th--asc .bsi-table__sort-icon svg path:first-child {
  opacity: 1;
}

.bsi-table__th--desc .bsi-table__sort-icon svg path:last-child {
  opacity: 1;
}

/* ===== TABLE BODY ===== */
.bsi-table__tbody {
  background: var(--color-bg-primary, #1A1A1A);
}

.bsi-table__row {
  transition: background-color var(--transition-timing-fast, 150ms) var(--transition-easing-ease-out, ease-out);
}

.bsi-table__tbody .bsi-table__row:hover {
  background: var(--color-bg-secondary, #2A2A2A);
}

.bsi-table__td {
  padding: var(--spacing-4, 1rem) var(--spacing-3, 0.75rem);
  border-bottom: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.85));
}

.bsi-table__td--left { text-align: left; }
.bsi-table__td--center { text-align: center; }
.bsi-table__td--right { text-align: right; }

/* ===== STRIPED VARIANT ===== */
.bsi-table--striped .bsi-table__tbody .bsi-table__row:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.bsi-table--striped .bsi-table__tbody .bsi-table__row:nth-child(even):hover {
  background: var(--color-bg-secondary, #2A2A2A);
}

/* ===== BORDERED VARIANT ===== */
.bsi-table--bordered {
  border: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-base, 0.5rem);
  overflow: hidden;
}

.bsi-table--bordered .bsi-table__th,
.bsi-table--bordered .bsi-table__td {
  border-right: 1px solid var(--color-border-default, rgba(255, 255, 255, 0.12));
}

.bsi-table--bordered .bsi-table__th:last-child,
.bsi-table--bordered .bsi-table__td:last-child {
  border-right: none;
}

/* ===== COMPACT VARIANT ===== */
.bsi-table--compact .bsi-table__th,
.bsi-table--compact .bsi-table__td {
  padding: var(--spacing-2, 0.5rem) var(--spacing-2, 0.5rem);
}

/* ===== RESPONSIVE MOBILE ===== */
@media (max-width: 768px) {
  .bsi-table-wrapper--responsive {
    margin-left: calc(var(--spacing-4, 1rem) * -1);
    margin-right: calc(var(--spacing-4, 1rem) * -1);
    padding-left: var(--spacing-4, 1rem);
    padding-right: var(--spacing-4, 1rem);
  }

  .bsi-table {
    font-size: var(--font-size-xs, 0.75rem);
  }

  .bsi-table__th,
  .bsi-table__td {
    padding: var(--spacing-2, 0.5rem);
  }

  .bsi-table__caption {
    padding: var(--spacing-2, 0.5rem);
    font-size: var(--font-size-sm, 0.875rem);
  }
}

/* ===== ACCESSIBILITY ===== */
@media (prefers-reduced-motion: reduce) {
  .bsi-table__th--sortable,
  .bsi-table__row,
  .bsi-table__sort-icon {
    transition-duration: 0.01ms;
  }
}

/* ===== PRINT ===== */
@media print {
  .bsi-table-wrapper--responsive {
    overflow: visible;
  }

  .bsi-table {
    border: 1px solid #CCCCCC;
  }

  .bsi-table__thead {
    background: #F5F5F5;
  }

  .bsi-table__row:hover {
    background: transparent;
  }

  .bsi-table__sort-icon {
    display: none;
  }
}

/* ===== LOADING STATE (OPTIONAL) ===== */
.bsi-table--loading {
  opacity: 0.6;
  pointer-events: none;
}

.bsi-table--loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border: 3px solid var(--color-brand-blaze-primary, #BF5700);
  border-radius: 50%;
  border-top-color: transparent;
  animation: bsi-table-spin 0.8s linear infinite;
}

@keyframes bsi-table-spin {
  to { transform: rotate(360deg); }
}

/* ===== EMPTY STATE ===== */
.bsi-table__empty {
  padding: var(--spacing-12, 3rem) var(--spacing-4, 1rem);
  text-align: center;
  color: var(--color-text-tertiary, rgba(255, 255, 255, 0.65));
  font-size: var(--font-size-base, 1rem);
}
</style>
`;
