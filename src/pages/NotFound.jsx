import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center animate-in fade-in duration-300">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#EEF4FC] text-[#1A396D] border border-[#C4D8F6] flex items-center justify-center text-xl">
          <i className="fas fa-layer-group"></i>
        </div>

        <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-2">
          Akses Menu Belum Tersedia
        </h2>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Akun Anda belum memiliki akses ke menu navigasi. Silakan hubungi Administrator untuk pengaturan wewenang.
        </p>

        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:border-[#1A396D] hover:bg-[#EEF4FC] hover:text-[#1A396D] text-slate-700 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fas fa-rotate-right text-[#1A396D]"></i>
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={isAuthenticated ? handleLogout : () => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-[#1A396D] hover:bg-[#142C54] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
