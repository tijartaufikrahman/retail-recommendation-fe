import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';

export default function Patterns() {
  const [data, setData] = useState({ rules: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, 100, high, medium
  const [selectedProduct, setSelectedProduct] = useState('');
  const [minSupport, setMinSupport] = useState(0.1);
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [minLift, setMinLift] = useState(1.0);
  const [showConfig, setShowConfig] = useState(false);

  const fetchData = useCallback(
    async (s = minSupport, c = minConfidence, l = minLift) => {
      setLoading(true);
      try {
        const res = await api.get(
          `/Analysis/patterns?min_support=${s}&min_confidence=${c}&min_lift=${l}`
        );
        setData(res.data?.data || res.data || { rules: [], summary: {} });
      } catch (err) {
        console.error('Failed to load patterns:', err);
      } finally {
        setLoading(false);
      }
    },
    [minSupport, minConfidence, minLift]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rules = useMemo(() => data.rules || [], [data]);

  // Tambahkan unique key untuk setiap rule agar DataTable stabil
  const rulesWithKeys = useMemo(() => {
    return rules.map((r, idx) => ({
      ...r,
      _key: `${(r.antecedent || []).join('-')}=>${(r.consequent || []).join('-')}-${idx}`,
    }));
  }, [rules]);

  // Ekstrak daftar produk unik untuk opsi filter dropdown
  const uniqueProducts = useMemo(() => {
    const set = new Set();
    rules.forEach((r) => {
      (r.antecedent || []).forEach((item) => set.add(item));
      (r.consequent || []).forEach((item) => set.add(item));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [rules]);

  // Hitung jumlah masing-masing kategori peluang
  const count100 = useMemo(
    () => rules.filter((r) => r.confidence >= 0.999).length,
    [rules]
  );
  const countHigh = useMemo(
    () => rules.filter((r) => r.confidence >= 0.7 && r.confidence < 0.999).length,
    [rules]
  );
  const countMedium = useMemo(
    () => rules.filter((r) => r.confidence >= 0.5 && r.confidence < 0.7).length,
    [rules]
  );

  // Filter berdasarkan Tab Peluang & Pilihan Produk
  const tableData = useMemo(() => {
    let list = [...rulesWithKeys];

    if (activeTab === '100') {
      list = list.filter((r) => r.confidence >= 0.999);
    } else if (activeTab === 'high') {
      list = list.filter((r) => r.confidence >= 0.7 && r.confidence < 0.999);
    } else if (activeTab === 'medium') {
      list = list.filter((r) => r.confidence >= 0.5 && r.confidence < 0.7);
    }

    if (selectedProduct) {
      list = list.filter(
        (r) =>
          (r.antecedent || []).includes(selectedProduct) ||
          (r.consequent || []).includes(selectedProduct)
      );
    }

    return list.sort((a, b) => b.confidence - a.confidence);
  }, [rulesWithKeys, activeTab, selectedProduct]);

  // Konfigurasi Kolom DataTable yang Terbaca Jelas, Elegan, dan Rapi
  const columns = useMemo(
    () => [
      {
        header: 'NO',
        width: '52px',
        align: 'center',
        sortable: false,
        render: (_r, globalIdx) => (
          <span className="font-mono text-[13px] text-slate-500 font-medium">#{globalIdx + 1}</span>
        ),
      },
      {
        header: 'PRODUK YANG DIBELI',
        accessor: (r) => (r.antecedent || []).join(' + '),
        sortable: true,
        render: (r) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            {r.antecedent?.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-500 font-bold text-xs">+</span>}
                <span className="bg-slate-50 text-slate-950 border border-slate-300 font-bold px-2.5 py-0.5 rounded text-[13px]">
                  {item}
                </span>
              </span>
            ))}
          </div>
        ),
      },
      {
        header: '',
        width: '32px',
        align: 'center',
        sortable: false,
        render: () => <i className="fas fa-arrow-right text-slate-500 text-xs"></i>,
      },
      {
        header: 'OTOMATIS IKUT BELI',
        accessor: (r) => (r.consequent || []).join(' + '),
        sortable: true,
        render: (r) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            {r.consequent?.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-500 font-bold text-xs">+</span>}
                <span className="bg-blue-50 text-[#1A396D] border border-blue-200 font-extrabold px-2.5 py-0.5 rounded text-[13px]">
                  {item}
                </span>
              </span>
            ))}
          </div>
        ),
      },
      {
        header: 'PELUANG BELI',
        accessor: 'confidence',
        sortable: true,
        align: 'center',
        width: '135px',
        render: (r) => {
          const pct = (r.confidence * 100).toFixed(0);
          const is100 = r.confidence >= 0.999;
          return (
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[13px] font-mono ${
                is100
                  ? 'bg-blue-50 text-[#1A396D] border border-blue-200 font-black'
                  : 'bg-slate-100 text-slate-950 border border-slate-300 font-bold'
              }`}
            >
              {pct}% Beli
            </span>
          );
        },
      },
      {
        header: 'REKOMENDASI PENEMPATAN',
        accessor: (r) =>
          `Dekatkan penempatan ${(r.consequent || []).join(' + ')} dengan ${(r.antecedent || []).join(' + ')}`,
        sortable: false,
        render: (r) => {
          const primary = (r.antecedent || []).join(' + ');
          const companion = (r.consequent || []).join(' + ');
          return (
            <div className="text-[13px] text-slate-900 py-1 leading-snug font-medium">
              Dekatkan penempatan <strong className="font-extrabold text-slate-950">{companion}</strong> dengan{' '}
              <strong className="font-extrabold text-slate-950">{primary}</strong>
            </div>
          );
        },
      },
      {
        header: 'FREKUENSI',
        accessor: 'support',
        sortable: true,
        align: 'center',
        width: '120px',
        render: (r) => (
          <span className="text-[13px] font-medium text-slate-700">
            {(r.support * 100).toFixed(0)}% struk
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5 text-slate-800">
      {/* Panel Sensitivitas (Buka/Tutup) */}
      {showConfig && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-6 py-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
              <i className="fas fa-filter text-slate-600"></i>
              Atur Sensitivitas Analisis FP-Growth:
            </div>
            <button
              onClick={() => setShowConfig(false)}
              className="text-[13px] text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <i className="fas fa-times"></i> Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-[13px] text-slate-800">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="flex justify-between font-medium text-slate-800 mb-1.5">
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

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="flex justify-between font-medium text-slate-800 mb-1.5">
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

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="flex justify-between font-medium text-slate-800 mb-1.5">
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
              className="h-[38px] px-4 bg-[#1A396D] hover:bg-[#142C54] text-white border-none font-medium text-[13px] rounded-lg cursor-pointer transition-all"
            >
              Terapkan Sensitivitas
            </button>
          </div>
        </div>
      )}

      {/* Unified DataTable Card: Clean White Card, Crisp Border, Dark Bold Text */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header Filter Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[13px] font-bold text-slate-800 mr-1 shrink-0">
              Filter Peluang:
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`h-[38px] px-3.5 rounded-lg text-[13px] font-semibold border transition-all shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#1A396D] text-white border-[#1A396D] shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              Semua ({rules.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('100')}
              className={`h-[38px] px-3.5 rounded-lg text-[13px] font-semibold border transition-all shrink-0 cursor-pointer ${
                activeTab === '100'
                  ? 'bg-[#1A396D] text-white border-[#1A396D] shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              Pasti 100% ({count100})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('high')}
              className={`h-[38px] px-3.5 rounded-lg text-[13px] font-semibold border transition-all shrink-0 cursor-pointer ${
                activeTab === 'high'
                  ? 'bg-[#1A396D] text-white border-[#1A396D] shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              Tinggi (&gt;70%) ({countHigh})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('medium')}
              className={`h-[38px] px-3.5 rounded-lg text-[13px] font-semibold border transition-all shrink-0 cursor-pointer ${
                activeTab === 'medium'
                  ? 'bg-[#1A396D] text-white border-[#1A396D] shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              Sedang (50%-70%) ({countMedium})
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-slate-700 shrink-0">Produk:</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="h-[38px] px-3 text-[13px] font-semibold text-slate-950 bg-white border border-slate-300 rounded-lg focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D] outline-none w-40 sm:w-52 shadow-2xs"
              >
                <option value="">Semua Produk ({uniqueProducts.length})</option>
                {uniqueProducts.map((p, idx) => (
                  <option key={idx} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {(activeTab !== 'all' || selectedProduct) && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSelectedProduct('');
                }}
                className="h-[38px] px-3 text-[13px] text-slate-700 hover:text-[#1A396D] hover:bg-[#EEF4FC] rounded-lg border border-slate-300 font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <i className="fas fa-rotate-left text-[#1A396D]"></i>
                <span>Reset</span>
              </button>
            )}

            {/* Tombol Sensitivitas */}
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`h-[38px] px-3.5 rounded-lg text-[13px] font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                showConfig
                  ? 'bg-[#EEF4FC] text-[#1A396D] border-[#BFD3F0]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Atur parameter min support, confidence, lift"
            >
              <i className="fas fa-sliders text-xs"></i>
              <span>Sensitivitas</span>
            </button>

            {/* Tombol Segarkan */}
            <button
              type="button"
              onClick={() => fetchData()}
              disabled={loading}
              className="h-[38px] px-3.5 bg-[#1A396D] hover:bg-[#142C54] text-white border-none font-medium text-[13px] rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Segarkan data analisis"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs text-white"></span>
              ) : (
                <i className="fas fa-arrows-rotate text-xs"></i>
              )}
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Card Body DataTable: Padding sejajar px-6 py-4 */}
        <div className="p-6">
          <DataTable
            columns={columns}
            data={tableData}
            loading={loading}
            keyField="_key"
            defaultPageLength={10}
            searchPlaceholder="Cari nama barang atau kombinasi..."
            emptyText="Tidak ditemukan kombinasi produk yang cocok dengan kriteria filter saat ini."
          />
        </div>
      </div>
    </div>
  );
}
