import { useState, useMemo } from 'react';

/**
 * Reusable Enterprise DataTable component
 * 100% compliant with aturan_datatable.txt
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  keyField = 'id',
  defaultPageLength = 10,
  searchPlaceholder = 'Ketik kata kunci...',
  emptyText = 'Data tidak ditemukan',
  emptyHeight = null,
  showLengthMenu = true,
  showSearch = true,
  showPagination = true,
  showInfo = true,
  borderless = false,
  actions = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLength, setPageLength] = useState(defaultPageLength);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 1. Filtering (Search across all columns / accessors)
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.toLowerCase();

    return data.filter((row) => {
      return columns.some((col) => {
        let val = null;
        if (col.accessor) {
          val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
        } else if (col.render) {
          // If no accessor, try inspecting values in row
          val = Object.values(row).join(' ');
        }
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchTerm, columns]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      let aVal = typeof sortConfig.key === 'function' ? sortConfig.key(a) : a[sortConfig.key];
      let bVal = typeof sortConfig.key === 'function' ? sortConfig.key(b) : b[sortConfig.key];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc'
        ? strA.localeCompare(strB, 'id', { numeric: true })
        : strB.localeCompare(strA, 'id', { numeric: true });
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // 3. Pagination calculation
  const totalRecords = data.length;
  const filteredTotal = filteredData.length;
  const isAll = pageLength === -1;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filteredTotal / pageLength));

  // Ensure current page is valid
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    if (isAll) return sortedData;
    const startIndex = (validCurrentPage - 1) * pageLength;
    return sortedData.slice(startIndex, startIndex + pageLength);
  }, [sortedData, validCurrentPage, pageLength, isAll]);

  const startIndex = filteredTotal === 0 ? 0 : isAll ? 1 : (validCurrentPage - 1) * pageLength + 1;
  const endIndex = isAll ? filteredTotal : Math.min(validCurrentPage * pageLength, filteredTotal);

  // Sorting Handler
  const handleSort = (column) => {
    if (column.sortable === false) return;
    const key = column.accessor || column.sortKey;
    if (!key) return;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Generate pagination buttons window
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (validCurrentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (validCurrentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = validCurrentPage - 1; i <= validCurrentPage + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`dataTables_wrapper dt-bootstrap5 ${borderless ? 'dt-borderless-wrapper' : ''}`}>
      {/* Top Toolbar: Length & Filter */}
      {(showLengthMenu || showSearch || actions) && (
        <div className="row dt-top-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="col-12 col-md-auto dt-toolbar-left" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {showLengthMenu && (
              <div className="dataTables_length">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', margin: 0, fontSize: '0.83rem', color: '#475569', fontWeight: 500 }}>
                  <span>Tampilkan</span>
                  <select
                    className="form-select form-select-sm dt-length-select"
                    style={{
                      height: '38px',
                      width: '74px',
                      minWidth: '70px',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      padding: '4px 24px 4px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      cursor: 'pointer',
                      display: 'inline-block',
                    }}
                    value={pageLength}
                    onChange={(e) => {
                      setPageLength(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>Semua</option>
                  </select>
                  <span>data per halaman</span>
                </label>
              </div>
            )}
          </div>

          <div className="col-12 col-md-auto dt-toolbar-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
            {showSearch && (
              <div className="dataTables_filter">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', margin: 0, fontSize: '0.83rem', color: '#475569', fontWeight: 500 }}>
                  <span>Cari:</span>
                  <input
                    type="search"
                    className="form-control form-control-sm dt-search-input"
                    style={{
                      height: '38px',
                      width: '220px',
                      maxWidth: '100%',
                      fontSize: '0.83rem',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      marginLeft: 0,
                      outline: 'none',
                    }}
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </label>
              </div>
            )}
            {actions && <div className="dt-toolbar-actions" style={{ display: 'inline-flex', alignItems: 'center' }}>{actions}</div>}
          </div>
        </div>
      )}

      {/* Middle Row: Table Container */}
      <div className={`row dt-row ${borderless ? 'm-0 p-0' : ''}`} style={borderless ? { margin: 0, padding: 0 } : undefined}>
        <div
          className={`col-sm-12 dt-table-container ${borderless ? 'dt-borderless-container' : ''}`}
          style={borderless ? { border: 'none', borderRadius: 0, boxShadow: 'none', margin: 0, padding: 0, background: 'transparent' } : undefined}
        >
          <table
            className={`table table-hover align-middle w-100 dataTable ${borderless ? 'dt-borderless-table' : ''}`}
            style={borderless ? { border: 'none', borderCollapse: 'collapse', margin: 0 } : undefined}
          >
            <thead>
              <tr>
                {columns.map((col, idx) => {
                  const isSortable = col.sortable !== false && (col.accessor || col.sortKey);
                  const isSorted = isSortable && (sortConfig.key === col.accessor || sortConfig.key === col.sortKey);
                  return (
                    <th
                      key={col.header || idx}
                      className={isSortable ? (isSorted ? (sortConfig.direction === 'asc' ? 'sorting_asc' : 'sorting_desc') : 'sorting') : 'sorting_disabled'}
                      style={{
                        width: col.width || 'auto',
                        textAlign: col.align || 'left',
                        cursor: isSortable ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      onClick={() => isSortable && handleSort(col)}
                    >
                      <div
                        className="dt-th-content"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
                          width: col.align ? '100%' : 'auto',
                        }}
                      >
                        <span>{col.header}</span>
                        {isSortable && (
                          <span className="dt-sort-indicator" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}>
                            {isSorted ? (
                              sortConfig.direction === 'asc' ? (
                                <i className="fas fa-arrow-up-short-wide" style={{ color: '#1A396D', fontWeight: 900 }}></i>
                              ) : (
                                <i className="fas fa-arrow-down-wide-short" style={{ color: '#1A396D', fontWeight: 900 }}></i>
                              )
                            ) : (
                              <i className="fas fa-sort" style={{ opacity: 0.35, color: '#94a3b8' }}></i>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <i className="fas fa-spinner fa-spin" style={{ color: '#1A396D', marginRight: '8px', fontSize: '18px' }}></i>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>Sedang memproses data...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: 0, color: '#94a3b8' }}>
                    <div
                      style={{
                        minHeight: emptyHeight || '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '30px 20px',
                      }}
                    >
                      <i className="fas fa-inbox" style={{ fontSize: '28px', display: 'block', marginBottom: '10px', color: '#cbd5e1' }}></i>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{emptyText}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => {
                  const globalIdx = (validCurrentPage - 1) * pageLength + rowIdx;
                  return (
                    <tr key={row[keyField] || rowIdx}>
                      {columns.map((col, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            textAlign: col.align || 'left',
                            width: col.width || 'auto',
                          }}
                        >
                          {col.render
                            ? col.render(row, globalIdx, rowIdx)
                            : col.accessor
                            ? typeof col.accessor === 'function'
                              ? col.accessor(row)
                              : row[col.accessor]
                            : null}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: DataTables Info & Pagination */}
      {(showInfo || showPagination) && (
        <div className="row dt-bottom-toolbar">
          {showInfo && (
            <div className={`col-sm-12 ${showPagination ? 'col-md-5' : 'col-md-12'} dt-info-col`}>
              <div className="dataTables_info">
                {filteredTotal === 0 ? (
                  'Menampilkan 0 sampai 0 dari 0 data'
                ) : (
                  <>
                    Menampilkan {startIndex} sampai {endIndex} dari {filteredTotal} total data
                    {searchTerm && totalRecords !== filteredTotal && (
                      <span style={{ marginLeft: '4px', color: '#94a3b8' }}>
                        (difilter dari {totalRecords} total data)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {showPagination && (
            <div className={`col-sm-12 ${showInfo ? 'col-md-7' : 'col-md-12'} dt-paginate-col`}>
              <div className="dataTables_paginate paging_simple_numbers">
                <ul className="pagination">
                  {/* First Page */}
                  <li className={`page-item ${validCurrentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage === 1}
                      title="Halaman Pertama"
                    >
                      &laquo;
                    </button>
                  </li>

                  {/* Previous Page */}
                  <li className={`page-item ${validCurrentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validCurrentPage === 1}
                      title="Halaman Sebelumnya"
                    >
                      &lsaquo;
                    </button>
                  </li>

                  {/* Page Numbers */}
                  {getPageNumbers().map((p, idx) =>
                    p === '...' ? (
                      <li key={`ellipsis-${idx}`} className="page-item disabled">
                        <span className="page-link page-ellipsis">...</span>
                      </li>
                    ) : (
                      <li key={`page-${p}`} className={`page-item ${p === validCurrentPage ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    )
                  )}

                  {/* Next Page */}
                  <li className={`page-item ${validCurrentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validCurrentPage === totalPages}
                      title="Halaman Berikutnya"
                    >
                      &rsaquo;
                    </button>
                  </li>

                  {/* Last Page */}
                  <li className={`page-item ${validCurrentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validCurrentPage === totalPages}
                      title="Halaman Terakhir"
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
