import React, { useState, useMemo, useId } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from './Button';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface ActionColumn<T> {
  header?: string;
  width?: string | number;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubmessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  actionColumn?: ActionColumn<T>;
  toolbarSlot?: React.ReactNode;
  maxHeight?: string | number;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Tidak Ada Data Ditemukan',
  emptySubmessage = 'Belum ada data atau kueri pencarian tidak cocok.',
  searchable = true,
  searchPlaceholder = 'Cari data...',
  searchKeys,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  actionColumn,
  toolbarSlot,
  maxHeight = '520px',
}: DataTableProps<T>) {
  const searchInputId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 1. Filtering
  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return data;
    const query = debouncedSearch.toLowerCase().trim();

    return data.filter((item) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = (item as Record<string, unknown>)[k as string];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
      }
      // Default: cari di seluruh properti string/number item
      return Object.values(item as Record<string, unknown>).some((val) => {
        return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
      });
    });
  }, [data, debouncedSearch, searchKeys]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA: unknown = col.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[sortKey];
      let valB: unknown = col.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[sortKey];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const compare = (valA as number) > (valB as number) ? 1 : -1;
      return sortDir === 'asc' ? compare : -compare;
    });
  }, [filteredData, sortKey, sortDir, columns]);

  // Reset to page 1 on search or sort change
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // 3. Pagination Slicing
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
    setCurrentPage(1);
  };

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(totalItems, currentPage * pageSize);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Table Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {searchable && (
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px', maxWidth: '420px' }}>
            <label htmlFor={searchInputId} className="sr-only">
              {searchPlaceholder}
            </label>
            <input
              id={searchInputId}
              type="search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.875rem 0.5rem 2.25rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                outline: 'none',
              }}
            />
            {/* Search Icon */}
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-hidden="true"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
        )}

        {toolbarSlot && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>{toolbarSlot}</div>}
      </div>

      {/* Dual Sticky Scroll Container */}
      <div
        style={{
          position: 'relative',
          overflow: 'auto',
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          width: '100%',
          backgroundColor: 'var(--color-surface)',
        }}
        tabIndex={0}
        aria-label="Tabel Data Pasien (dapat digulir horizontal dan vertikal)"
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: '0.875rem',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      backgroundColor: 'var(--color-surface-hover)',
                      color: 'var(--color-text-secondary)',
                      padding: '0.75rem 1rem',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      borderBottom: '2px solid var(--color-border)',
                      borderRight: '1px solid var(--color-border-subtle)',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      width: col.width,
                      minWidth: col.minWidth || '120px',
                      textAlign: col.align || 'left',
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span style={{ fontSize: '0.75rem', color: isSorted ? 'var(--color-primary)' : 'var(--color-text-muted)' }} aria-hidden="true">
                          {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {/* STICKY TOP-RIGHT CORNER (Intersection Header) */}
              {actionColumn && (
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    right: 0,
                    zIndex: 20, /* Highest z-index: wins over both vertical and horizontal scroll */
                    backgroundColor: 'var(--color-surface-hover)',
                    color: 'var(--color-text-secondary)',
                    padding: '0.75rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    borderBottom: '2px solid var(--color-border)',
                    borderLeft: '1px solid var(--color-border)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    width: actionColumn.width || '140px',
                    minWidth: actionColumn.width || '140px',
                    boxShadow: '-3px 0 6px -2px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  {actionColumn.header || 'Aksi'}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              // Loading Skeleton Rows
              [1, 2, 3, 4, 5].map((rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <div
                        style={{
                          height: '16px',
                          width: colIdx === 0 ? '45%' : '80%',
                          backgroundColor: 'var(--color-border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          opacity: 0.6,
                        }}
                      />
                    </td>
                  ))}
                  {actionColumn && (
                    <td
                      style={{
                        position: 'sticky',
                        right: 0,
                        zIndex: 5,
                        backgroundColor: 'var(--color-surface)',
                        padding: '1rem',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        borderLeft: '1px solid var(--color-border-subtle)',
                        boxShadow: '-3px 0 6px -2px rgba(15, 23, 42, 0.08)',
                      }}
                    >
                      <div
                        style={{
                          height: '24px',
                          width: '70px',
                          backgroundColor: 'var(--color-border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          margin: '0 auto',
                          opacity: 0.6,
                        }}
                      />
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (actionColumn ? 1 : 0)}
                  style={{
                    padding: 'var(--space-12) var(--space-4)',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }} aria-hidden="true">
                    📋
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {emptyMessage}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {emptySubmessage}
                  </p>
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((row, rowIdx) => {
                const key = String(keyExtractor(row));
                const isEven = rowIdx % 2 === 1;

                return (
                  <tr
                    key={key}
                    style={{
                      backgroundColor: isEven ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    {columns.map((col) => {
                      const cellValue = col.render
                        ? col.render(row, (currentPage - 1) * pageSize + rowIdx)
                        : String((row as Record<string, unknown>)[col.key] ?? '-');

                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: '0.875rem 1rem',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            borderRight: '1px solid var(--color-border-subtle)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.875rem',
                            textAlign: col.align || 'left',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cellValue}
                        </td>
                      );
                    })}

                    {/* STICKY ACTION COLUMN CELL */}
                    {actionColumn && (
                      <td
                        style={{
                          position: 'sticky',
                          right: 0,
                          zIndex: 5,
                          backgroundColor: isEven ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                          padding: '0.875rem 1rem',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          borderLeft: '1px solid var(--color-border)',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          boxShadow: '-3px 0 6px -2px rgba(15, 23, 42, 0.08)',
                        }}
                      >
                        {actionColumn.render(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            Menampilkan <strong>{startRecord}</strong> - <strong>{endRecord}</strong> dari <strong>{totalItems}</strong> data
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <label htmlFor="datatable-page-size" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Baris:
            </label>
            <select
              id="datatable-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <Button
            variant="secondary"
            size="sm"
            label="Sebelumnya"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            &laquo; Sebelumnya
          </Button>

          <span style={{ padding: '0 var(--space-2)', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Halaman {currentPage} / {totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            label="Berikutnya"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Berikutnya &raquo;
          </Button>
        </div>
      </div>
    </div>
  );
}
