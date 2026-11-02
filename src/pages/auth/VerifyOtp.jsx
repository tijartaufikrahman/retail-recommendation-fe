import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';

export default function VerifyOtp() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    // Focus first input on mount
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Allow only numeric
    const cleanVal = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // Handle paste
      const pasted = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputsRef.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto advance
    if (cleanVal && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setErrorMsg('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    if (!email) {
      setErrorMsg('Email tidak ditemukan. Silakan ulangi dari awal.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp(email, otpCode);
      if (res && res.success) {
        setSuccessMsg('Verifikasi berhasil! Mengalihkan ke reset password...');
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otpCode)}`);
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Kode OTP tidak valid.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      const msg = err.response?.data?.message || 'Kode OTP salah atau telah kedaluwarsa.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authService.sendOtp(email);
      if (res && res.success) {
        setSuccessMsg('Kode OTP baru telah dikirim ke email!');
        setCountdown(60);
        setCanResend(false);
        setDigits(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      } else {
        setErrorMsg(res.message || 'Gagal mengirim ulang OTP.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengirim ulang kode OTP.');
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
            <i className="fas fa-shield-halved"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verifikasi Kode OTP</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Masukkan 6 digit kode verifikasi yang telah dikirimkan ke:
          </p>
          <div className="inline-block mt-2 px-3.5 py-1 bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-full break-all">
            {email || 'Email tidak diketahui'}
          </div>
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

        <form onSubmit={handleVerify}>
          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2 sm:gap-2.5 my-6">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 sm:w-12 h-14 sm:h-16 text-center text-2xl font-extrabold text-[#1A396D] bg-slate-50 border-2 border-slate-200 focus:border-[#1A396D] focus:bg-white focus:outline-none rounded-2xl shadow-sm transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className="btn w-full bg-[#1A396D] hover:bg-[#142C54] active:bg-[#0F2242] text-white font-bold border-none rounded-xl shadow-lg shadow-[#1A396D]/30 h-12 text-sm transition-all"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <i className="fas fa-check-circle mr-1.5"></i>
                <span>Verifikasi OTP</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500">
          Belum menerima kode?{' '}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-[#1A396D] hover:underline"
            >
              Kirim Ulang OTP
            </button>
          ) : (
            <span className="font-semibold text-slate-400">
              Kirim Ulang ({countdown}s)
            </span>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link to="/forgot-password" className="text-[#1A396D] hover:underline">
            &larr; Ganti Email
          </Link>
          <Link to="/login" className="text-[#1A396D] hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
