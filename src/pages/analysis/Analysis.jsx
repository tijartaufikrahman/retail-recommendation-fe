import { useState, useEffect, useCallback } from 'react';
import { analysisService } from '../../services/api';

export default function Analysis() {
  const [minSupport, setMinSupport] = useState(0.2);
  const [minConfidence, setMinConfidence] = useState(0.4);
  const [minLift, setMinLift] = useState(1.0);

  const [loading, setLoading] = useState(true);
  const [dataPatterns, setDataPatterns] = useState(null);
  const [dataRecommendations, setDataRecommendations] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const params = { minSupport, minConfidence, minLift };
      const [patternsRes, recRes] = await Promise.all([
        analysisService.getPatterns(params),
        analysisService.getRecommendations(params),
      ]);

      setDataPatterns(patternsRes?.data || patternsRes);
      setDataRecommendations(recRes?.data || recRes);
    } catch (err) {
      console.error('Failed to run FP-Growth analysis:', err);
      alert('Gagal menjalankan analisis FP-Growth.');
    } finally {
      setLoading(false);
    }
  }, [minSupport, minConfidence, minLift]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const rules = dataPatterns?.rules || [];
  const recommendations = dataRecommendations?.recommendations || [];
  const totalTransaksi = dataPatterns?.totalTransaksi || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#EEF4FC] text-[#1A396D] border border-[#C4D8F6] flex items-center justify-center text-lg">
              <i className="fas fa-brain"></i>
            </span>
            Analisis Pola & Rekomendasi Rak (FP-Growth)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data mining pola asosiasi belanja konsumen menggunakan algoritma Frequent Pattern Growth (FP-Growth) untuk optimasi tata letak display produk.
          </p>
        </div>
        <div>
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="btn btn-primary bg-[#1A396D] hover:bg-[#142C54] active:bg-[#0F2242] text-white border-none shadow-md shadow-[#1A396D]/25 gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Menganalisis...
              </>
            ) : (
              <>
                <i className="fas fa-play"></i> Hitung Ulang Pola
              </>
            )}
          </button>
        </div>
      </div>

      {/* Parameter Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <i className="fas fa-sliders text-[#1A396D]"></i> Konfigurasi Parameter Ambang Batas (Threshold)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Min Support */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Minimum Support</span>
              <span className="font-mono text-[#1A396D] font-bold text-sm">
                {(minSupport * 100).toFixed(0)}% ({minSupport})
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={minSupport}
              onChange={(e) => setMinSupport(parseFloat(e.target.value))}
              className="range range-xs range-primary"
            />
            <p className="text-[11px] text-slate-400">
              Batas minimum frekuensi kemunculan kombinasi item dari total struk transaksi.
            </p>
          </div>

          {/* Min Confidence */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Minimum Confidence</span>
              <span className="font-mono text-[#1A396D] font-bold text-sm">
                {(minConfidence * 100).toFixed(0)}% ({minConfidence})
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="range range-xs range-primary"
            />
            <p className="text-[11px] text-slate-400">
              Tingkat kepastian: jika konsumen membeli item A, seberapa besar kemungkinan membeli B.
            </p>
          </div>

          {/* Min Lift */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Minimum Lift Ratio</span>
              <span className="font-mono text-[#1A396D] font-bold text-sm">{minLift.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={minLift}
              onChange={(e) => setMinLift(parseFloat(e.target.value))}
              className="range range-xs range-primary"
            />
            <p className="text-[11px] text-slate-400">
              Kekuatan asosiasi: Lift &gt; 1.0 mengindikasikan korelasi positif yang saling mendukung.
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EEF4FC] text-[#1A396D] border border-[#C4D8F6] flex items-center justify-center text-xl">
            <i className="fas fa-database"></i>
          </div>
          <div>
            <p className="text-xs text-slate-400">Dataset Transaksi</p>
            <p className="text-xl font-bold text-[#1A396D] font-mono">{totalTransaksi} Trx</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EEF4FC] text-[#1A396D] border border-[#C4D8F6] flex items-center justify-center text-xl">
            <i className="fas fa-network-wired"></i>
          </div>
          <div>
            <p className="text-xs text-slate-400">Aturan Asosiasi</p>
            <p className="text-xl font-bold text-[#1A396D] font-mono">{rules.length} Rules</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div>
            <p className="text-xs text-slate-400">Rekomendasi Rak</p>
            <p className="text-xl font-bold text-slate-900 font-mono">{recommendations.length} Butir</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <i className="fas fa-chart-line"></i>
          </div>
          <div>
            <p className="text-xs text-slate-400">Lift Tertinggi</p>
            <p className="text-xl font-bold text-purple-700 font-mono">
              {rules.length > 0 ? `${rules[0].lift.toFixed(2)}x` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Actionable Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i className="fas fa-boxes-stacked text-amber-500"></i> Rekomendasi Penataan Display Rak Produk
          </h2>
          <span className="badge badge-warning badge-outline text-xs font-semibold">
            Actionable Insights
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <i className="fas fa-circle-info text-3xl mb-2 text-slate-300"></i>
            <p className="text-sm">Tidak ada aturan yang memenuhi ambang batas saat ini.</p>
            <p className="text-xs text-slate-400 mt-1">Coba turunkan nilai Minimum Support atau Minimum Confidence di atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/60 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge badge-neutral text-xs font-mono font-bold">
                      Rekomendasi #{idx + 1}
                    </span>
                    <span className="badge badge-warning text-xs font-mono font-bold">
                      Lift: {rec.lift.toFixed(2)}x
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed font-medium mb-3">
                    {rec.recommendation}
                  </p>
                </div>

                <div className="pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Support: {(rec.support * 100).toFixed(1)}%</span>
                  <span>Confidence: {(rec.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Association Rules Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <i className="fas fa-table-list text-[#1A396D]"></i> Tabel Aturan Pola Asosiasi (Association Rules)
        </h2>

        {rules.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">Belum ada aturan yang ditemukan pada parameter saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <tr className="text-xs text-slate-700 border-b border-slate-200">
                  <th className="text-center w-12">NO</th>
                  <th>ITEM ANTECEDENT (JIKA BELI)</th>
                  <th className="text-center w-12"><i className="fas fa-arrow-right"></i></th>
                  <th>ITEM CONSEQUENT (MAKA BELI)</th>
                  <th className="text-center">SUPPORT</th>
                  <th className="text-center">CONFIDENCE</th>
                  <th className="text-center">LIFT RATIO</th>
                  <th className="text-center">STATUS KORELASI</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors text-xs">
                    <td className="text-center font-bold text-slate-400 font-mono">{idx + 1}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {rule.antecedent?.map((a, i) => (
                          <span key={i} className="badge badge-info badge-sm font-semibold">
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-center text-slate-300">
                      <i className="fas fa-arrow-right-long text-xs"></i>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {rule.consequent?.map((c, i) => (
                          <span key={i} className="badge badge-success badge-sm text-white font-semibold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-center font-mono font-semibold text-slate-700">
                      {(rule.support * 100).toFixed(1)}%
                    </td>
                    <td className="text-center font-mono font-semibold text-[#1A396D]">
                      {(rule.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="text-center font-mono font-extrabold text-[#1A396D]">
                      {rule.lift.toFixed(2)}x
                    </td>
                    <td className="text-center">
                      {rule.lift >= 1.5 ? (
                        <span className="badge badge-success badge-xs font-semibold">Sangat Kuat</span>
                      ) : rule.lift >= 1.0 ? (
                        <span className="badge badge-warning badge-xs font-semibold">Positif</span>
                      ) : (
                        <span className="badge badge-ghost badge-xs">Netral</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
