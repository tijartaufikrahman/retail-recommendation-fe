import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@retail.com');
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Alamat email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);
      if (res && res.success) {
        setSuccessMsg('Login berhasil. Mengalihkan ke halaman sistem...');
        const token = res.data?.token || res.token;
        const targetUrl = await login(res.data?.user || res.user, token);
        setTimeout(() => {
          navigate(targetUrl || '/dashboard');
        }, 400);
      } else {
        setErrorMsg(res.message || 'Email atau kata sandi tidak sesuai.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Gagal masuk. Periksa kembali koneksi sistem.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white text-slate-800 flex flex-col justify-between selection:bg-[#1A396D] selection:text-white">
      {/* =========================================================
          MAIN CONTENT (LANDING & LOGIN)
          ========================================================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 lg:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Sisi Kiri: Title Bersih & Sub Text Lengkap */}
          <div className="lg:col-span-7 space-y-4 pr-0 lg:pr-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Manajemen Transaksi & Rekomendasi Retail
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Aplikasi terpusat untuk memproses seluruh transaksi kasir harian, mengelola data persediaan dan kategori barang, mencatat riwayat penjualan secara real-time, serta menyajikan rekomendasi pola belanja konsumen guna mendukung penataan produk di etalase toko secara efektif.
            </p>
          </div>

          {/* Sisi Kanan: Form Login Bersih & Rapi */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Masuk ke Akun
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Silakan masukkan email dan kata sandi Anda untuk mengakses sistem.
                </p>
              </div>

              {/* Pesan Kesalahan / Berhasil */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <i className="fas fa-circle-exclamation text-rose-500 shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <i className="fas fa-circle-check text-emerald-600 shrink-0"></i>
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors focus:bg-white focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kata Sandi
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-medium text-slate-500 hover:text-[#1A396D] transition-colors"
                    >
                      Lupa sandi?
                    </Link>
                  </div>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors focus:bg-white focus:border-[#1A396D] focus:ring-1 focus:ring-[#1A396D]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                      title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox checkbox-xs rounded border-slate-300"
                    />
                    <span className="text-xs text-slate-600">Ingat sesi saya</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#1A396D] hover:bg-[#142C54] active:bg-[#0F2242] text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-md shadow-[#1A396D]/25"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-xs text-white"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <i className="fas fa-arrow-right text-[11px]"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="w-full border-t border-slate-200/70 bg-transparent py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Seluruh hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Panduan Pengguna</span>
            <span>&bull;</span>
            <span>Bantuan Layanan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
