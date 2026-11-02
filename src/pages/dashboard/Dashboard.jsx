import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_kategori: 0,
    total_produk: 0,
    total_transaksi: 0,
    total_pendapatan: 0,
    category_distribution: [],
    sales_trend: [],
    sales_trend_daily: [],
    sales_trend_monthly: [],
    sales_trend_yearly: [],
    top_products: [],
  });
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/Dashboard/stats');
        const d = res.data?.data || res.data || {};
        setStats({
          total_kategori: d.total_kategori ?? 0,
          total_produk: d.total_produk ?? 0,
          total_transaksi: d.total_transaksi ?? 0,
          total_pendapatan: d.total_pendapatan ?? 0,
          category_distribution: d.category_distribution || [],
          sales_trend: d.sales_trend || [],
          sales_trend_daily: d.sales_trend_daily || [],
          sales_trend_monthly: d.sales_trend_monthly || [],
          sales_trend_yearly: d.sales_trend_yearly || [],
          top_products: d.top_products || [],
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  // Dataset tren penjualan 7 hari terakhir
  const salesData = useMemo(() => {
    return stats.sales_trend_daily && stats.sales_trend_daily.length > 0
      ? stats.sales_trend_daily
      : (stats.sales_trend || []);
  }, [stats]);

  // Helper SVG Area/Line Chart
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 40;

  const maxTotal = Math.max(...salesData.map((s) => s.total || 0), 60000);

  const getCoordinates = () => {
    if (salesData.length === 0) return [];
    const availableWidth = svgWidth - paddingX * 2;
    const availableHeight = svgHeight - paddingTop - paddingBottom;
    const stepX = salesData.length > 1 ? availableWidth / (salesData.length - 1) : availableWidth / 2;

    return salesData.map((item, idx) => {
      const x = paddingX + idx * stepX;
      const normalizedY = (item.total || 0) / maxTotal;
      const y = svgHeight - paddingBottom - normalizedY * availableHeight;
      return { x, y, item };
    });
  };

  const points = getCoordinates();

  const generateSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  // Helper Donut Chart
  const categoryColors = [
    '#1A396D', // Brand Royal Blue
    '#3B82F6', // Cobalt
    '#0EA5E9', // Sky Light
    '#6366F1', // Indigo Blue
    '#F59E0B', // Amber
  ];

  const totalCatProducts = stats.category_distribution.reduce((acc, c) => acc + (c.total_produk || 0), 0) || 1;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const donutSlices = stats.category_distribution.map((cat, idx) => {
    const percent = (cat.total_produk || 0) / totalCatProducts;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...cat,
      color: categoryColors[idx % categoryColors.length],
      percent: (percent * 100).toFixed(0),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. 4 Stat Cards Utama: Clean Pure White, Crisp Light Border, Dark Bold Text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Kategori */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all duration-150">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
                Total Kategori
              </p>
              <h3 className="text-3xl font-extrabold font-mono mt-1 text-slate-950">
                {loading ? <span className="loading loading-spinner loading-sm"></span> : stats.total_kategori}
              </h3>
              <p className="text-xs text-slate-700 mt-1.5 flex items-center gap-1 font-medium">
                <i className="fas fa-check-circle text-emerald-600 text-[11px]"></i>
                <span>4 Klaster utama toko</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A396D] border border-blue-100 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-tags"></i>
            </div>
          </div>
        </div>

        {/* Stat 2: Produk */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all duration-150">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
                Total Produk
              </p>
              <h3 className="text-3xl font-extrabold font-mono mt-1 text-slate-950">
                {loading ? <span className="loading loading-spinner loading-sm"></span> : stats.total_produk}
              </h3>
              <p className="text-xs text-slate-700 mt-1.5 flex items-center gap-1 font-medium">
                <i className="fas fa-box text-blue-600 text-[11px]"></i>
                <span>20 SKU aktif siap jual</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-boxes-stacked"></i>
            </div>
          </div>
        </div>

        {/* Stat 3: Transaksi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all duration-150">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
                Total Transaksi
              </p>
              <h3 className="text-3xl font-extrabold font-mono mt-1 text-slate-950">
                {loading ? <span className="loading loading-spinner loading-sm"></span> : stats.total_transaksi}
              </h3>
              <p className="text-xs text-slate-700 mt-1.5 flex items-center gap-1 font-medium">
                <i className="fas fa-receipt text-indigo-600 text-[11px]"></i>
                <span>100 Struk terekam kasir</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-receipt"></i>
            </div>
          </div>
        </div>

        {/* Stat 4: Omset */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
                Total Omset
              </p>
              <h3 className="text-2xl font-extrabold font-mono mt-1 text-slate-950 truncate max-w-[170px]" title={formatRupiah(stats.total_pendapatan)}>
                {loading ? <span className="loading loading-spinner loading-sm"></span> : formatRupiah(stats.total_pendapatan)}
              </h3>
              <p className="text-xs text-slate-700 mt-1.5 flex items-center gap-1 font-medium">
                <i className="fas fa-arrow-trend-up text-emerald-600 text-[11px]"></i>
                <span>Penerimaan kasir nyata</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-money-bill-wave"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bagian Grafik Analitik Visual: Clean White Cards, Crisp Light Borders, Dark Sharp Text */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik 1: Tren Nilai Transaksi Penjualan */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A396D] border border-blue-100 flex items-center justify-center text-sm shrink-0">
                <i className="fas fa-chart-line"></i>
              </span>
              <div>
                <h3 className="font-bold text-[14px] text-slate-950 leading-none">
                  Tren Penjualan 7 Hari Terakhir
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Pergerakan omset harian kasir dalam 7 hari terakhir
                </p>
              </div>
            </div>
          </div>

          {/* SVG Chart Canvas */}
          <div className="w-full pt-4 relative">
            {hoveredPoint && (
              <div
                className="absolute bg-white border border-slate-200 text-slate-900 text-xs px-3.5 py-2 rounded-xl shadow-lg pointer-events-none transition-all duration-150 z-20"
                style={{
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                }}
              >
                <span className="font-extrabold block text-[#1A396D] text-[13px]">{formatRupiah(hoveredPoint.item.total)}</span>
                <span className="text-[11px] text-slate-900 font-bold block mt-0.5">
                  {hoveredPoint.item.label || hoveredPoint.item.periode || hoveredPoint.item.tanggal}
                </span>
                <span className="text-[10px] text-slate-600 font-mono font-medium block mt-0.5">
                  {hoveredPoint.item.jumlah_transaksi ?? 0} transaksi kasir
                </span>
              </div>
            )}

            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A396D" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1A396D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines Horizontal Dotted */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = svgHeight - paddingBottom - ratio * (svgHeight - paddingTop - paddingBottom);
                const val = maxTotal * ratio;
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#64748b"
                      className="font-mono font-medium"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

              {/* Smooth Curve Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1A396D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {points.map((pt, idx) => (
                <g key={pt.item.key || pt.item.label || idx} className="cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.item?.key === pt.item.key ? '6' : '4.5'}
                    fill="#ffffff"
                    stroke="#1A396D"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="transition-all duration-150 hover:r-6"
                  />
                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#334155"
                    className="font-mono font-bold"
                  >
                    {pt.item.tanggal}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Grafik 2: Distribusi Kategori Produk (SVG Donut Chart) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A396D] border border-blue-100 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-chart-pie"></i>
                </span>
                <div>
                  <h3 className="font-bold text-[14px] text-slate-950 leading-none">
                    Distribusi Kategori
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Komposisi 20 produk katalog
                  </p>
                </div>
              </div>
              <span className="bg-slate-100 text-slate-900 border border-slate-300 font-mono text-xs font-bold px-2.5 py-1 rounded-md">
                {stats.category_distribution.length} Kategori
              </span>
            </div>

            {/* SVG Donut Graphic */}
            <div className="relative flex items-center justify-center py-5">
              <svg width="150" height="150" viewBox="0 0 150 150" className="transform -rotate-90">
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="16"
                />
                {donutSlices.map((slice, i) => (
                  <circle
                    key={i}
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="16"
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>

              {/* Center Stats */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-extrabold font-mono text-slate-950">
                  {stats.total_produk}
                </span>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                  Produk
                </span>
              </div>
            </div>
          </div>

          {/* Legend Slices */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {donutSlices.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                ></span>
                <div className="truncate">
                  <span className="text-[12px] text-slate-900 font-bold block truncate">
                    {cat.kategori}
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono font-medium">
                    {cat.total_produk} SKU ({cat.percent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grafik 3: Produk Terlaris (Ranking Bars) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A396D] border border-blue-100 flex items-center justify-center text-sm shrink-0">
                <i className="fas fa-ranking-star"></i>
              </span>
              <div>
                <h3 className="font-bold text-[14px] text-slate-950 leading-none">
                  Produk Paling Sering Terjual
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Volume unit penjualan tertinggi di kasir
                </p>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-900 border border-slate-300 font-mono text-xs font-bold px-2.5 py-1 rounded-md">
              Top 5 Terlaris
            </span>
          </div>

          <div className="space-y-3.5 pt-4">
            {stats.top_products.map((p, idx) => {
              const maxQty = stats.top_products[0]?.total_terjual || 1;
              const widthPercent = ((p.total_terjual / maxQty) * 100).toFixed(0);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center text-[10px] font-extrabold">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[200px] sm:max-w-[280px]">{p.produk}</span>
                    </span>
                    <span className="font-mono font-extrabold text-[#1A396D] text-xs">
                      {p.total_terjual} unit
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1A396D] h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {stats.top_products.length === 0 && (
              <div className="text-center text-slate-500 py-8 text-xs font-medium">
                Belum ada data produk terjual.
              </div>
            )}
          </div>
        </div>

        {/* Tabel Kontribusi Pendapatan */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A396D] border border-blue-100 flex items-center justify-center text-sm shrink-0">
                <i className="fas fa-coins"></i>
              </span>
              <div>
                <h3 className="font-bold text-[14px] text-slate-950 leading-none">
                  Kontribusi Pendapatan Terbesar
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Akumulasi nilai penjualan per produk
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-slate-100 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 rounded-l-lg">Produk</th>
                  <th className="py-2.5 px-3 text-center">Unit Terjual</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Total Omset</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {stats.top_products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <td className="font-bold text-slate-900 py-2.5">
                      <span className="truncate block max-w-[180px] sm:max-w-[240px]">
                        {p.produk}
                      </span>
                    </td>
                    <td className="text-center font-mono font-bold text-slate-800">
                      {p.total_terjual} Pcs
                    </td>
                    <td className="text-right font-mono font-extrabold text-slate-950">
                      {formatRupiah(p.pendapatan)}
                    </td>
                  </tr>
                ))}
                {stats.top_products.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center text-slate-500 py-8 font-medium">
                      Belum ada data transaksi tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
