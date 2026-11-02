import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

export default function Recommendations() {
  const [minSupport, setMinSupport] = useState(0.15);
  const [minConfidence, setMinConfidence] = useState(0.3);
  const [minLift, setMinLift] = useState(1.0);

  // Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all' | '100' | 'high' | 'unapplied' | 'applied'
  const [selectedProduct, setSelectedProduct] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedItems, setAppliedItems] = useState({});
  const [showConfig, setShowConfig] = useState(false);

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const fetchData = async (sup = minSupport, conf = minConfidence, lft = minLift) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/Analysis/recommendations?minSupport=${sup}&minConfidence=${conf}&minLift=${lft}`
      );
      const data = res.data?.data || res.data || {};
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      alert('Gagal memuat rekomendasi penataan toko.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleApplied = (index) => {
    setAppliedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Ambil semua daftar nama produk unik dari rekomendasi
  const uniqueProducts = useMemo(() => {
    const set = new Set();
    recommendations.forEach((r) => {
      (r.antecedent || []).forEach((item) => set.add(item));
      (r.consequent || []).forEach((item) => set.add(item));
    });
    return Array.from(set).sort();
  }, [recommendations]);

  // Hitung jumlah untuk badge filter
  const count100 = useMemo(
    () => recommendations.filter((r) => r.confidence >= 0.999).length,
    [recommendations]
  );
  const countHigh = useMemo(
    () => recommendations.filter((r) => r.confidence >= 0.7 && r.confidence < 0.999).length,
    [recommendations]
  );
  const appliedCount = Object.values(appliedItems).filter(Boolean).length;
  const unappliedCount = recommendations.length - appliedCount;

  // Filter & Urutkan langsung dari persentase tertinggi (Confidence descending)
  const filteredRecs = useMemo(() => {
    let list = [...recommendations].sort((a, b) => b.confidence - a.confidence);

    if (activeTab === '100') {
      list = list.filter((r) => r.confidence >= 0.999);
    } else if (activeTab === 'high') {
      list = list.filter((r) => r.confidence >= 0.7 && r.confidence < 0.999);
    } else if (activeTab === 'unapplied') {
      list = list.filter((_, i) => !appliedItems[i]);
    } else if (activeTab === 'applied') {
      list = list.filter((_, i) => !!appliedItems[i]);
    }

    if (selectedProduct) {
      list = list.filter(
        (r) =>
          (r.antecedent || []).includes(selectedProduct) ||
          (r.consequent || []).includes(selectedProduct)
      );
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((r) => {
        const ant = (r.antecedent || []).join(' ').toLowerCase();
        const con = (r.consequent || []).join(' ').toLowerCase();
        return ant.includes(q) || con.includes(q);
      });
    }

    return list;
  }, [recommendations, activeTab, selectedProduct, searchTerm, appliedItems]);

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Rekomendasi Penataan Rak Display Toko
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Daftar produk yang sebaiknya dipajang berdampingan di rak toko, diurutkan dari potensi pembeli tertinggi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Buka Filter Sensitivitas */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`btn btn-sm text-xs font-semibold rounded-xl border ${
              showConfig
                ? 'bg-slate-200 text-slate-900 border-slate-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <i className="fas fa-sliders text-xs"></i>
            Sensitivitas
          </button>

          {/* Tombol Segarkan */}
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="btn btn-sm bg-[#1A396D] hover:bg-[#142C54] text-white border-none font-semibold text-xs rounded-xl px-4 gap-1.5 shadow-xs"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs text-white"></span>
            ) : (
              <i className="fas fa-arrows-rotate text-xs"></i>
            )}
            Segarkan
          </button>
        </div>
      </div>

      {/* 2. Panel Sensitivitas (Opsional) */}
      {showConfig && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <i className="fas fa-filter text-slate-600"></i>
              Atur Sensitivitas Analisis:
            </div>
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              <i className="fas fa-times"></i> Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-800">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between font-semibold text-slate-800 mb-1">
                <span>Minimal Muncul di Struk:</span>
                <span className="font-bold text-slate-900">{(minSupport * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={minSupport}
                onChange={(e) => setMinSupport(parseFloat(e.target.value) || 0.05)}
                className="range range-xs w-full"
              />
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between font-semibold text-slate-800 mb-1">
                <span>Minimal Kepastian Beli:</span>
                <span className="font-bold text-slate-900">{(minConfidence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value) || 0.1)}
                className="range range-xs w-full"
              />
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between font-semibold text-slate-800 mb-1">
                <span>Kekuatan Hubungan:</span>
                <span className="font-bold text-slate-900">&gt; {minLift}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={minLift}
                onChange={(e) => setMinLift(parseFloat(e.target.value) || 0.5)}
                className="range range-xs w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                fetchData(minSupport, minConfidence, minLift);
                setShowConfig(false);
              }}
              className="btn btn-xs bg-slate-800 hover:bg-slate-900 text-white border-none font-semibold px-4 rounded-lg"
            >
              Terapkan Sensitivitas
            </button>
          </div>
        </div>
      )}

      {/* 3. TOOLBAR FILTER LENGKAP & RAPI */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-xs space-y-3">
        {/* Baris 1: Filter Status & Persentase */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-1 shrink-0 uppercase tracking-wider">
              Filter:
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`btn btn-xs rounded-lg font-bold px-3 border transition-colors shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Semua ({recommendations.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('100')}
              className={`btn btn-xs rounded-lg font-bold px-3 border transition-colors shrink-0 ${
                activeTab === '100'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Sangat Cocok 100% ({count100})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('high')}
              className={`btn btn-xs rounded-lg font-bold px-3 border transition-colors shrink-0 ${
                activeTab === 'high'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Prioritas Tinggi (&gt;70%) ({countHigh})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unapplied')}
              className={`btn btn-xs rounded-lg font-bold px-3 border transition-colors shrink-0 ${
                activeTab === 'unapplied'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Belum Ditata ({unappliedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('applied')}
              className={`btn btn-xs rounded-lg font-bold px-3 border transition-colors shrink-0 ${
                activeTab === 'applied'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Sudah Selesai ({appliedCount})
            </button>
          </div>

          {(activeTab !== 'all' || selectedProduct || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSelectedProduct('');
                setSearchTerm('');
              }}
              className="text-xs text-slate-700 hover:text-slate-900 hover:underline font-semibold shrink-0"
            >
              <i className="fas fa-rotate-left mr-1"></i> Reset Filter
            </button>
          )}
        </div>

        {/* Baris 2: Dropdown Pilih Produk & Kolom Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 shrink-0">Produk:</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="select select-xs select-bordered rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 border-slate-300 w-full sm:w-56 focus:border-slate-500"
              >
                <option value="">Semua Produk ({uniqueProducts.length})</option>
                {uniqueProducts.map((p, idx) => (
                  <option key={idx} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-xs input-bordered w-full pl-8 pr-2.5 rounded-lg text-xs font-medium text-slate-800 focus:border-slate-500"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-auto shrink-0">
            Menampilkan <strong className="text-slate-800">{filteredRecs.length}</strong> posisi rak
          </div>
        </div>
      </div>

      {/* 4. TABEL REKOMENDASI RAK (HANYA TABEL, TEKS DARK, BADGE ABU-ABU) */}
      <div className="bg-white rounded-lg border border-slate-200/90 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <span className="loading loading-spinner loading-md text-slate-700"></span>
            <p className="text-xs font-semibold text-slate-600">Memuat rekomendasi rak...</p>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="py-14 text-center p-6">
            <i className="fas fa-boxes-packing text-2xl text-slate-300 mb-2"></i>
            <h3 className="text-sm font-bold text-slate-700">Tidak Ada Rekomendasi yang Cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ditemukan rekomendasi penataan dengan filter yang dipilih saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full text-[13px] text-slate-800">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="w-12 text-center text-slate-700">#</th>
                  <th className="text-slate-800 font-bold">Produk Utama</th>
                  <th className="w-8 text-center text-slate-500 font-bold">+</th>
                  <th className="text-slate-800 font-bold">Rekomendasi Rak Berdampingan</th>
                  <th className="text-center w-36 text-slate-800 font-bold">Tingkat Kecocokan</th>
                  <th className="text-center w-36 text-slate-700 font-bold">Status Pengerjaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredRecs.map((rec, i) => {
                  const isApplied = !!appliedItems[i];
                  const confPct = (rec.confidence * 100).toFixed(0);

                  return (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="text-center font-normal text-slate-500 font-mono">#{i + 1}</td>
                      <td>
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          {rec.antecedent?.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5">
                              {idx > 0 && <span className="text-slate-400 font-normal text-xs">+</span>}
                              <span className="font-normal text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-md">
                                {item}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-center text-slate-400 font-normal">+</td>
                      <td>
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          {rec.consequent?.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5">
                              {idx > 0 && <span className="text-slate-400 font-normal text-xs">+</span>}
                              <span className="font-normal text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-md">
                                {item}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-sm font-normal bg-slate-100 text-slate-700 border-slate-300 py-2 px-2.5">
                          {confPct}% Cocok
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleApplied(i)}
                          className={`btn btn-xs rounded-lg font-medium border transition-colors ${
                            isApplied
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <i className="fas fa-check text-[#BFD3F0] text-[10px]"></i> Selesai
                            </>
                          ) : (
                            'Tandai Selesai'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
