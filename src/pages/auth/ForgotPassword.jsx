import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOtp(email.trim().toLowerCase());
      if (res && res.success) {
        setSuccessMsg(res.message || 'Kode OTP telah dikirim!');
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Gagal mengirim kode OTP.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      const msg = err.response?.data?.message || 'Terjadi kesalahan sistem saat memproses email.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#eef7f5] relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(45, 212, 191, 0.22) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.18) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(13, 148, 136, 0.12) 0%, transparent 40%)
          `,
        }}
      />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1A396D] to-[#204684] text-white flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-[#1A396D]/25">
            <i className="fas fa-key"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lupa Kata Sandi</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Masukkan alamat email akun Anda. Kami akan mengirimkan 6 digit kode OTP untuk verifikasi pemulihan sandi.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <i className="fas fa-circle-exclamation mt-0.5 shrink-0"></i>
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3">
            <i className="fas fa-circle-check mt-0.5 shrink-0"></i>
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Email Terdaftar
            </label>
            <div className="relative flex items-center">
              <i className="fas fa-envelope absolute left-4 text-slate-400 text-sm pointer-events-none"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="input w-full pl-11 bg-slate-50 border-slate-300 focus:bg-white focus:border-[#1A396D] focus:outline-none rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-full bg-[#1A396D] hover:bg-[#142C54] active:bg-[#0F2242] text-white font-bold border-none rounded-xl shadow-lg shadow-[#1A396D]/30 h-12 text-sm transition-all"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Mengirim Kode OTP...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-1.5"></i>
                <span>Kirim Kode OTP</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Ingat kata sandi Anda?{' '}
          <Link to="/login" className="font-bold text-[#1A396D] hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
