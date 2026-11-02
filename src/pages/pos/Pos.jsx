import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

export default function Pos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      const url = query ? `/Pos/products?q=${encodeURIComponent(query)}` : '/Pos/products';
      const res = await api.get(url);
      const data = res.data?.data || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load POS products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchProducts(val);
  };

  const toggleCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          nama: product.nama,
          kode_produk: product.kode_produk,
          harga: product.harga,
          kategori_nama: product.kategori_nama,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const resetCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan semua item di keranjang?')) {
      setCart([]);
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.harga * item.qty, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.kategori_nama) set.add(p.kategori_nama);
    });
    return ['Semua', ...Array.from(set)];
  }, [products]);

  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'Semua') return products;
    return products.filter((p) => p.kategori_nama === selectedCategory);
  }, [products, selectedCategory]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({ productId: i.id, qty: i.qty })),
      };
      const res = await api.post('/Pos/checkout', payload);
      const data = res.data;
      if (data.success || res.status === 201) {
        setSuccessReceipt({
          ...data.data,
          items: [...cart],
          grandTotal: cartTotal,
        });
        setCart([]);
      } else {
        alert(data.message || 'Transaksi gagal');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal memproses transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-900">
      {/* POS Grid: Catalog (Left) + Cart Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Product Catalog */}
        <div className="lg:col-span-8 space-y-5">
          {/* Toolbar Card: Search Input & Category Buttons */}
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Cari produk... (ketik nama barang atau kode barcode)"
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full h-[38px] pl-10 pr-9 text-[13px] bg-white border border-slate-300 rounded-lg focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] text-slate-950 font-medium transition-all placeholder:text-slate-400 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      fetchProducts('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>

              <span className="text-[13px] text-slate-700 font-semibold shrink-0 self-end sm:self-auto">
                Ditemukan <strong className="text-slate-950 font-mono">{displayedProducts.length}</strong> produk
              </span>
            </div>

            {/* Quick Filter Category Chips */}
            {categories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-[38px] px-3.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-[#1A396D] text-white border border-[#1A396D] shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-[#1A396D] border border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Products Grid: 3 Kolom Lapang */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
              <span className="loading loading-spinner loading-md text-[#1A396D] mx-auto mb-3"></span>
              <p className="text-[13px] font-semibold text-slate-800">Memuat katalog barang kasir...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#1A396D] border border-blue-100 mx-auto flex items-center justify-center text-lg mb-3">
                <i className="fas fa-box-open"></i>
              </div>
              <p className="font-bold text-[13px] text-slate-900">Produk tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedProducts.map((p) => {
                const inCart = cart.find((c) => c.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleCart(p)}
                    className={`rounded-xl p-4.5 transition-all duration-150 cursor-pointer select-none flex flex-col justify-between group ${
                      inCart
                        ? 'bg-blue-50/70 border-2 border-[#1A396D] shadow-xs'
                        : 'bg-white border border-slate-200 hover:border-[#1A396D] hover:shadow-xs shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top metadata: Kategori & Kode */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md truncate max-w-[125px]">
                          {p.kategori_nama || 'Umum'}
                        </span>
                        <span className="font-mono text-[12px] font-semibold text-slate-500">
                          {p.kode_produk}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-semibold text-[13px] text-slate-950 group-hover:text-[#1A396D] transition-colors leading-snug line-clamp-2 min-h-[2.4rem] mt-2.5">
                        {p.nama}
                      </h3>
                    </div>

                    {/* Bottom: Price + Action Button */}
                    <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[15px] font-semibold text-slate-950 font-mono tracking-tight block truncate">
                          {formatRupiah(p.harga)}
                        </span>
                      </div>

                      {inCart ? (
                        <div className="h-[38px] px-3.5 rounded-lg bg-[#1A396D] text-white flex items-center gap-1.5 text-[13px] font-semibold shadow-xs shrink-0">
                          <i className="fas fa-check text-xs"></i>
                          <span className="font-mono">{inCart.qty} Pcs</span>
                        </div>
                      ) : (
                        <div className="h-[38px] px-3.5 rounded-lg bg-white group-hover:bg-[#1A396D] text-slate-800 group-hover:text-white border border-slate-300 group-hover:border-[#1A396D] transition-all duration-150 flex items-center gap-1.5 text-[13px] font-semibold shadow-2xs shrink-0">
                          <i className="fas fa-plus text-xs"></i>
                          <span>Pilih</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart Drawer */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Cart Header (px-6 py-4) */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#1A396D] border border-blue-100 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-shopping-cart"></i>
                </span>
                <div>
                  <h3 className="font-semibold text-sm text-slate-950 leading-none">Struk Kasir</h3>
                  <span className="text-[12px] text-slate-600 mt-1 block font-medium">Daftar item belanja aktif</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-900 border border-slate-200 font-mono font-semibold px-2.5 py-1 rounded-md text-[13px]">
                  {cartItemCount} item
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={resetCart}
                    className="h-[38px] px-3 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Kosongkan keranjang"
                  >
                    <i className="fas fa-trash-can text-xs"></i>
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 mx-auto flex items-center justify-center text-lg mb-1">
                    <i className="fas fa-shopping-basket"></i>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">Keranjang masih kosong</p>
                  <p className="text-xs text-slate-500">Klik produk di katalog kiri untuk menambahkan item.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-slate-950 truncate">{item.nama}</p>
                      <p className="text-[13px] text-slate-700 font-mono mt-1 font-medium">
                        {formatRupiah(item.harga)} x {item.qty} ={' '}
                        <span className="font-semibold text-[#1A396D] font-mono">
                          {formatRupiah(item.harga * item.qty)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-[36px] h-[36px] bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
                        >
                          <i className="fas fa-minus text-[10px] text-[#1A396D]"></i>
                        </button>
                        <span className="w-9 h-[36px] bg-white border-x border-slate-300 font-mono font-semibold text-center flex items-center justify-center text-[13px] text-slate-950">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-[36px] h-[36px] bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
                        >
                          <i className="fas fa-plus text-[10px] text-[#1A396D]"></i>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-[36px] h-[36px] rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center text-xs transition-colors cursor-pointer"
                        title="Hapus item"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer Calculation */}
            <div className="px-6 py-4.5 border-t border-slate-100 space-y-3.5 bg-white">
              <div className="flex justify-between items-center text-[13px] text-slate-700 font-semibold">
                <span>Total Kuantitas:</span>
                <span className="font-mono font-semibold text-slate-950">{cartItemCount} Pcs</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-semibold text-[13px] text-slate-950">Total Pembayaran:</span>
                <span className="text-2xl font-bold font-mono text-[#1A396D]">
                  {formatRupiah(cartTotal)}
                </span>
              </div>

              {/* Action Buttons: Ukuran dan tinggi seragam 38px, font 13px setara Sidebar Button */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetCart}
                  disabled={cart.length === 0}
                  className="h-[38px] px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:text-[#1A396D] font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-undo text-[#1A396D]"></i>
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || submitting}
                  className="h-[38px] px-4 rounded-lg bg-[#1A396D] hover:bg-[#142C54] active:bg-[#0F2242] text-white font-semibold text-[13px] shadow-sm transition-all flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      <span>Bayar Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Success Modal */}
      {successReceipt && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-white p-0 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-[#EEF3F9] px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
                <i className="fas fa-circle-check text-[#1A396D]"></i> Transaksi Berhasil!
              </h3>
              <button
                type="button"
                onClick={() => setSuccessReceipt(null)}
                className="btn btn-xs btn-circle btn-ghost text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-[#EEF3F9] text-[#1A396D] border border-[#BFD3F0] flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs">
                  <i className="fas fa-check"></i>
                </div>
                <p className="text-[13px] text-slate-500 font-mono">
                  No. Struk: <strong className="text-slate-800">{successReceipt.kode_transaksi}</strong>
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5 max-h-56 overflow-y-auto">
                {successReceipt.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-[13px] py-1 border-b border-slate-200/60 last:border-none"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{item.nama}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.qty} x {formatRupiah(item.harga)}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatRupiah(item.harga * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-[13px] font-bold border-t border-slate-100 pt-3">
                <span className="text-slate-600 font-medium">Total Lunas:</span>
                <span className="text-2xl font-bold font-mono text-[#1A396D]">
                  {formatRupiah(successReceipt.grandTotal)}
                </span>
              </div>

              <div className="modal-action mt-4">
                <button
                  type="button"
                  onClick={() => setSuccessReceipt(null)}
                  className="h-[38px] rounded-lg bg-[#1A396D] hover:bg-[#142C54] text-white font-medium text-[13px] w-full shadow-sm cursor-pointer"
                >
                  Transaksi Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
