import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [pageLength, setPageLength] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [prodKode, setProdKode] = useState('');
  const [prodNama, setProdNama] = useState('');
  const [prodKategori, setProdKategori] = useState('');
  const [prodHarga, setProdHarga] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/Categories');
      const data = res.data?.data || res.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/Products');
      const data = res.data?.data || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setIsEdit(false);
    setModalId(null);
    setProdKode('');
    setProdNama('');
    setProdKategori(categories.length > 0 ? categories[0].id : '');
    setProdHarga('');
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setIsEdit(true);
    setModalId(p.id);
    setProdKode(p.kodeProduk || '');
    setProdNama(p.nama || '');
    setProdKategori(p.categoryId || '');
    setProdHarga(p.harga || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!prodKode.trim() || !prodNama.trim() || !prodKategori || !prodHarga) {
      alert('Semua field wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        kodeProduk: prodKode.trim().toUpperCase(),
        nama: prodNama.trim(),
        categoryId: Number(prodKategori),
        harga: parseFloat(prodHarga),
      };

      if (isEdit) {
        await api.put(`/Products/${modalId}`, payload);
      } else {
        await api.post('/Products', payload);
      }

      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus produk "${nama}"?`)) return;

    try {
      await api.delete(`/Products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menghapus produk');
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.nama.toLowerCase().includes(q) ||
        (p.kodeProduk && p.kodeProduk.toLowerCase().includes(q)) ||
        (p.categoryNama && p.categoryNama.toLowerCase().includes(q));
      const matchCat =
        !selectedCatFilter || String(p.categoryId) === String(selectedCatFilter);
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCatFilter]);

  const pagedProducts = useMemo(() => {
    if (pageLength === -1) return filteredProducts;
    const start = (currentPage - 1) * pageLength;
    return filteredProducts.slice(start, start + pageLength);
  }, [filteredProducts, currentPage, pageLength]);

  const totalPages = pageLength === -1 ? 1 : Math.ceil(filteredProducts.length / pageLength) || 1;

  const exportExcel = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['No,Kode,Nama,Kategori,Harga']
        .concat(
          filteredProducts.map(
            (p, i) =>
              `${i + 1},"${p.kodeProduk}","${p.nama}","${p.categoryNama || '-'}","${p.harga}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'produk.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5 text-slate-900">
      {/* Main Table Card: Clean White, Crisp Light Border, Dark Bold Text */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
            <span className="text-[13px] text-slate-700 font-semibold mr-1">data</span>

            <select
              value={selectedCatFilter}
              onChange={(e) => {
                setSelectedCatFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-[38px] px-3 rounded-lg border border-slate-300 text-[13px] font-bold text-slate-950 bg-white focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
              <input
                type="text"
                placeholder="Cari kode atau nama..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[38px] pl-9 pr-3 text-[13px] bg-white border border-slate-300 rounded-lg text-slate-950 font-medium w-48 sm:w-60 focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none"
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
            <button
              onClick={openCreateModal}
              className="h-[38px] px-4 rounded-lg bg-[#1A396D] hover:bg-[#142C54] active:bg-[#0F2242] text-white font-semibold text-[13px] shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <i className="fas fa-plus"></i> Tambah Produk
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="table w-full">
            <thead className="bg-slate-100 text-slate-950 text-[12px] uppercase font-extrabold tracking-wider border-b border-slate-200">
              <tr>
                <th className="text-center w-14 py-3">No</th>
                <th className="text-center w-36 py-3">Kode SKU</th>
                <th className="py-3">Nama Produk</th>
                <th className="text-center w-44 py-3">Kategori</th>
                <th className="text-right w-40 py-3">Harga Satuan</th>
                <th className="text-center w-36 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <span className="loading loading-spinner loading-md text-[#1A396D] mb-2"></span>
                    <p className="text-[13px] font-semibold text-slate-800">Memuat katalog produk...</p>
                  </td>
                </tr>
              ) : pagedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <i className="fas fa-box-open text-3xl mb-2 text-slate-400"></i>
                    <p className="text-[13px] font-bold text-slate-900">Tidak ada produk ditemukan</p>
                  </td>
                </tr>
              ) : (
                pagedProducts.map((p, idx) => (
                  <tr key={p.id} className="text-[13px] text-slate-900 hover:bg-slate-50 transition-colors">
                    <td className="text-center font-bold text-slate-500 font-mono py-3">
                      {(currentPage - 1) * (pageLength === -1 ? 0 : pageLength) + idx + 1}
                    </td>
                    <td className="text-center font-mono py-3">
                      <span className="badge bg-slate-100 text-slate-950 border border-slate-300 font-mono font-bold px-2.5 py-1 rounded text-xs tracking-wider">
                        {p.kodeProduk}
                      </span>
                    </td>
                    <td className="font-bold text-slate-950 text-[13.5px] py-3">{p.nama}</td>
                    <td className="text-center py-3">
                      <span className="badge bg-slate-100 text-slate-900 border border-slate-300 font-bold px-2.5 py-1 rounded text-xs">
                        {p.categoryNama || '-'}
                      </span>
                    </td>
                    <td className="text-right font-extrabold font-mono text-slate-950 text-[14px] py-3">
                      {formatRupiah(p.harga)}
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="h-[32px] px-2.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg font-bold text-[12px] inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="Edit Produk"
                        >
                          <i className="fas fa-pen text-[10px]"></i> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.nama)}
                          className="h-[32px] px-2.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-[12px] inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="Hapus Produk"
                        >
                          <i className="fas fa-trash text-[10px]"></i> Hapus
                        </button>
                      </div>
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
            Menampilkan <strong className="text-slate-800">{pagedProducts.length}</strong> dari <strong className="text-slate-800">{filteredProducts.length}</strong> data produk
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

      {/* Modal Tambah/Edit Produk */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg bg-white p-0 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-[#EEF3F9] px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
                <i className={`fas ${isEdit ? 'fa-pen-to-square' : 'fa-plus-circle'} text-[#1A396D]`}></i>
                {isEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-xs btn-circle btn-ghost text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[13px] font-medium text-slate-700 py-1">Kode Produk (SKU)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PRD021"
                    className="h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-[13px] font-mono text-slate-800 uppercase focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none w-full shadow-2xs"
                    value={prodKode}
                    onChange={(e) => setProdKode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-[13px] font-medium text-slate-700 py-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="15000"
                    className="h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-[13px] font-mono text-slate-800 focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none w-full shadow-2xs"
                    value={prodHarga}
                    onChange={(e) => setProdHarga(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label text-[13px] font-medium text-slate-700 py-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Susu Coklat UHT 250ml"
                  className="h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none w-full shadow-2xs"
                  value={prodNama}
                  onChange={(e) => setProdNama(e.target.value)}
                />
              </div>

              <div>
                <label className="label text-[13px] font-medium text-slate-700 py-1">Kategori</label>
                <select
                  required
                  className="h-[38px] px-3 bg-white border border-slate-300 rounded-lg text-[13px] font-medium text-slate-800 focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none w-full shadow-2xs"
                  value={prodKategori}
                  onChange={(e) => setProdKategori(e.target.value)}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama} ({c.kodeKategori})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-action pt-3 border-t border-slate-100 mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-[38px] px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[13px] cursor-pointer"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[38px] px-4 rounded-lg bg-[#1A396D] hover:bg-[#142C54] active:bg-[#0F2242] text-white font-medium text-[13px] shadow-sm cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span> Menyimpan...
                    </>
                  ) : (
                    'Simpan Produk'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
