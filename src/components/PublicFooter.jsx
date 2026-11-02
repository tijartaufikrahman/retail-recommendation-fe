export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#1A396D] flex items-center justify-center text-white font-bold">
              <i className="fas fa-shield-halved text-sm"></i>
            </div>
            <span className="text-white font-extrabold text-lg">Template R&amp;D Platform</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Sistem manajemen identitas terpadu (IAM), otorisasi berbasis peran (RBAC), dan arsitektur menu navigasi dinamis berbasis database online yang aman dan skalabel.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Modul Sistem</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="hover:text-blue-300 transition cursor-pointer">Identity &amp; Access Management (IAM)</span></li>
            <li><span className="hover:text-blue-300 transition cursor-pointer">Dynamic Navigation Engine</span></li>
            <li><span className="hover:text-blue-300 transition cursor-pointer">Multi-Tenant RBAC</span></li>
            <li><span className="hover:text-blue-300 transition cursor-pointer">Audit Logs &amp; Security</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Keamanan &amp; Server</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>Online Database Active</span>
            </li>
            <li><span>SQL Server 2022 Hosted</span></li>
            <li><span>REST API .NET Core 8</span></li>
            <li><span>Vite + React 19 Frontend</span></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>&copy; 2026 Template R&amp;D. Seluruh hak cipta dilindungi.</div>
        <div className="flex gap-4">
          <span className="hover:text-blue-300 cursor-pointer">Kebijakan Privasi</span>
          <span className="hover:text-blue-300 cursor-pointer">Syarat &amp; Ketentuan</span>
          <span className="hover:text-blue-300 cursor-pointer">Dokumentasi API</span>
        </div>
      </div>
    </footer>
  );
}
