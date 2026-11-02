import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { formatDateTimeWib } from '../../utils/date';

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const todayStr = getTodayDate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageLength, setPageLength] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrx, setSelectedTrx] = useState(null);

  const fetchTransactions = async (start = startDate, end = endDate) => {
    setLoading(true);
    try {
      let url = '/Transactions?limit=500';
      if (start) url += `&startDate=${encodeURIComponent(start)}`;
      if (end) url += `&endDate=${encodeURIComponent(end)}`;
      const res = await api.get(url);
      const data = res.data?.data || res.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(startDate, endDate);
  }, []);

  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchTransactions(startDate, endDate);
  };

  const resetFilter = () => {
    setStartDate('');
    setEndDate('');
    setSearch('');
    setCurrentPage(1);
    fetchTransactions('', '');
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalOmsetAll = useMemo(() => {
    return transactions.reduce((a, b) => a + (b.total || 0), 0);
  }, [transactions]);

  const avgTrxValue = useMemo(() => {
    return transactions.length > 0 ? totalOmsetAll / transactions.length : 0;
  }, [transactions, totalOmsetAll]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.kodeTransaksi.toLowerCase().includes(q) ||
        (t.items && t.items.some((i) => i.productNama?.toLowerCase().includes(q)));

      let matchDate = true;
      if (startDate) {
        const trxDate = new Date(t.tanggal);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (trxDate < start) matchDate = false;
      }
      if (endDate) {
        const trxDate = new Date(t.tanggal);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (trxDate > end) matchDate = false;
      }

      return matchSearch && matchDate;
    });
  }, [transactions, search, startDate, endDate]);

  const pagedTransactions = useMemo(() => {
    if (pageLength === -1) return filteredTransactions;
    const start = (currentPage - 1) * pageLength;
    return filteredTransactions.slice(start, start + pageLength);
  }, [filteredTransactions, currentPage, pageLength]);

  const totalPages = pageLength === -1 ? 1 : Math.ceil(filteredTransactions.length / pageLength) || 1;

  const exportExcel = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['No,Kode Transaksi,Tanggal,Total']
        .concat(
          filteredTransactions.map(
            (t, i) =>
              `${i + 1},"${t.kodeTransaksi}","${t.tanggal}","${t.total}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'riwayat_transaksi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5 text-slate-900">
      {/* 1. Filter Card: Clean White Card, Crisp Border, Dark Bold Text */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2.5 text-[13px] whitespace-nowrap min-w-max">
          <span className="font-bold text-slate-900 flex items-center gap-1.5 shrink-0">
            <i className="fas fa-calendar-alt text-[#1A396D]"></i> Filter Tanggal:
          </span>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-[13px] font-mono font-bold text-slate-950 focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none shrink-0"
          />

          <span className="text-slate-500 font-bold px-0.5 shrink-0">s/d</span>

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-[13px] font-mono font-bold text-slate-950 focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none shrink-0"
          />

          <button
            type="button"
            className="h-[38px] px-3.5 bg-[#1A396D] hover:bg-[#142C54] text-white font-semibold text-[13px] rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            onClick={handleApplyFilter}
          >
            <i className="fas fa-filter text-xs"></i> Terapkan
          </button>

          <button
            type="button"
            onClick={() => {
              const t = getTodayDate();
              setStartDate(t);
              setEndDate(t);
              setCurrentPage(1);
              fetchTransactions(t, t);
            }}
            className="h-[38px] px-3.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-[#1A396D] border border-slate-300 font-semibold text-[13px] rounded-lg transition-all cursor-pointer shrink-0"
            title="Tampilkan transaksi hari ini"
          >
            Hari Ini
          </button>

          <button
            type="button"
            className="h-[38px] px-3.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-[#1A396D] border border-slate-300 font-semibold text-[13px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            onClick={resetFilter}
            title="Kosongkan filter dan tampilkan semua transaksi"
          >
            <i className="fas fa-undo text-xs text-[#1A396D]"></i> Reset
          </button>
        </div>
      </div>

      {/* 2. Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-slate-700 font-semibold">Tampilkan</span>
            <select
              value={pageLength}
              onChange={(e) => {
                setPageLength(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-[38px] px-3 rounded-lg border border-slate-300 text-[13px] font-bold text-slate-950 bg-white focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>Semua</option>
            </select>
            <span className="text-[13px] text-slate-700 font-semibold">data per halaman</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
              <input
                type="text"
                placeholder="Cari nomor struk atau produk..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[38px] pl-9 pr-3 text-[13px] bg-white border border-slate-300 rounded-lg text-slate-950 font-medium w-52 sm:w-68 focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none"
              />
            </div>
            <button
              onClick={exportExcel}
              className="h-[38px] px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:text-[#1A396D] text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export Excel"
            >
              <i className="fas fa-file-excel text-[#1A396D]"></i> Excel
            </button>
            <button
              onClick={exportPDF}
              className="h-[38px] px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:text-[#1A396D] text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Cetak PDF"
            >
              <i className="fas fa-file-pdf text-[#1A396D]"></i> PDF
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="table w-full">
            <thead className="bg-slate-100 text-slate-950 text-[12px] uppercase font-extrabold tracking-wider border-b border-slate-200">
              <tr>
                <th className="text-center w-14 py-3">No</th>
                <th className="text-center w-56 py-3">Kode Transaksi</th>
                <th className="text-center w-48 py-3">Tanggal</th>
                <th className="text-center w-36 py-3">Item</th>
                <th className="text-right w-44 py-3">Total Belanja</th>
                <th className="text-center w-32 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <span className="loading loading-spinner loading-md text-[#1A396D] mb-2"></span>
                    <p className="text-[13px] font-semibold text-slate-800">Memuat riwayat transaksi...</p>
                  </td>
                </tr>
              ) : pagedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <i className="fas fa-receipt text-3xl mb-2 text-slate-400"></i>
                    <p className="text-[13px] font-bold text-slate-900">Tidak ada transaksi ditemukan</p>
                  </td>
                </tr>
              ) : (
                pagedTransactions.map((t, idx) => (
                  <tr key={t.id} className="text-[13px] text-slate-900 hover:bg-slate-50 transition-colors">
                    <td className="text-center font-bold text-slate-500 font-mono py-3">
                      {(currentPage - 1) * (pageLength === -1 ? 0 : pageLength) + idx + 1}
                    </td>
                    <td className="text-center font-mono py-3">
                      <span className="badge bg-slate-100 text-slate-950 border border-slate-300 font-mono font-bold px-2.5 py-1 rounded text-xs tracking-wider">
                        {t.kodeTransaksi}
                      </span>
                    </td>
                    <td className="text-center text-slate-800 font-semibold py-3">
                      {formatDateTimeWib(t.tanggal)}
                    </td>
                    <td className="text-center py-3">
                      <span className="badge bg-slate-100 text-slate-900 border border-slate-300 font-bold px-2.5 py-1 rounded text-xs">
                        {t.totalItem ?? t.items?.reduce((a, b) => a + b.qty, 0) ?? 0} Pcs
                      </span>
                    </td>
                    <td className="text-right font-extrabold font-mono text-slate-950 text-[14px] py-3">
                      {formatRupiah(t.total)}
                    </td>
                    <td className="text-center py-3">
                      <button
                        onClick={() => setSelectedTrx(t)}
                        className="h-[32px] px-3 bg-blue-50 text-[#1A396D] hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-[13px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Lihat Detail Struk"
                      >
                        <i className="fas fa-eye text-xs text-[#1A396D]"></i> Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-[13px] text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-800">{pagedTransactions.length}</strong> dari <strong className="text-slate-800">{filteredTransactions.length}</strong> struk transaksi
          </span>
          {totalPages > 1 && (
            <div className="join shadow-2xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="join-item h-[34px] px-3 text-[13px] font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                « Prev
              </button>
              <button className="join-item h-[34px] px-3 text-[13px] font-bold border border-[#1A396D] bg-[#1A396D] text-white pointer-events-none">
                Hal {currentPage} / {totalPages}
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="join-item h-[34px] px-3 text-[13px] font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                Next »
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTrx && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg bg-white p-0 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-[#EEF3F9] px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <i className="fas fa-receipt text-[#1A396D]"></i> Rincian Struk Transaksi
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="btn btn-xs btn-circle btn-ghost text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block">Kode Transaksi</span>
                  <span className="font-bold font-mono text-slate-800 text-sm">{selectedTrx.kodeTransaksi}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Waktu Pembelian</span>
                  <span className="font-medium text-slate-700">{formatDateTimeWib(selectedTrx.tanggal)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="table table-sm w-full">
                  <thead className="bg-slate-100 text-slate-800 font-bold text-xs">
                    <tr>
                      <th className="py-2.5">Produk</th>
                      <th className="text-center py-2.5">Qty</th>
                      <th className="text-right py-2.5">Harga</th>
                      <th className="text-right py-2.5">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {selectedTrx.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="font-medium text-slate-800 py-2">{item.productNama}</td>
                        <td className="text-center font-mono py-2">{item.qty}</td>
                        <td className="text-right font-mono py-2">{formatRupiah(item.harga)}</td>
                        <td className="text-right font-mono font-semibold text-slate-900 py-2">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="font-bold text-sm text-slate-800">Total Pembayaran:</span>
                <span className="text-xl font-black font-mono text-[#1A396D]">
                  {formatRupiah(selectedTrx.total)}
                </span>
              </div>

              <div className="modal-action mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTrx(null)}
                  className="h-[38px] px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[13px] transition-all cursor-pointer w-full"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
