import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotFound from '../pages/NotFound';
import ErrorPage from '../pages/ErrorPage';

export default function DashboardLayout() {
  const { user, logout, navigation, loadingNav, isAuthenticated } = useAuth();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 991 : false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 991;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on route change
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
      logout();
      navigate('/login');
    }
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  };

  const toggleGroup = (groupId, currentOpenState) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !currentOpenState,
    }));
  };

  // Extract all allowed URLs from active navigation tree
  const allowedRoutes = useMemo(() => {
    const set = new Set();
    if (!navigation || !Array.isArray(navigation)) return set;

    const addUrl = (rawUrl) => {
      if (!rawUrl || rawUrl === '#') return;
      let normalized = rawUrl.toLowerCase().split('?')[0].replace(/\/$/, '');
      if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
      }
      set.add(normalized);
    };

    for (const item of navigation) {
      if (item.type === 'menu' && item.url) {
        addUrl(item.url);
      }
      if (item.type === 'group' && Array.isArray(item.subMenus)) {
        for (const sub of item.subMenus) {
          if (sub.url) {
            addUrl(sub.url);
          }
        }
      }
    }
    return set;
  }, [navigation]);

  // Cek apakah user memiliki menu sidebar
  const hasSidebarMenus = useMemo(() => {
    if (!navigation || !Array.isArray(navigation) || navigation.length === 0) return false;
    return navigation.some((item) => {
      if (item.type === 'menu' && item.url && item.url !== '#') return true;
      if (item.type === 'group' && Array.isArray(item.subMenus) && item.subMenus.length > 0) {
        return item.subMenus.some((sub) => sub.url && sub.url !== '#');
      }
      return false;
    });
  }, [navigation]);

  // Satukan menu Pola Belanja dan Rekomendasi menjadi 1 menu: "Pola & Rekomendasi"
  const processedNavigation = useMemo(() => {
    if (!navigation || !Array.isArray(navigation)) return [];

    return navigation
      .filter((item) => {
        if (item.type === 'menu' && item.url?.toLowerCase().replace(/\/$/, '') === '/recommendations') {
          return false;
        }
        return true;
      })
      .map((item) => {
        if (item.type === 'menu') {
          if (item.url?.toLowerCase().replace(/\/$/, '') === '/patterns') {
            return {
              ...item,
              label: 'Pola & Rekomendasi',
              icon: 'fas fa-layer-group',
            };
          }
          return item;
        }

        if (item.type === 'group' && Array.isArray(item.subMenus)) {
          const filteredSub = item.subMenus
            .filter((sub) => sub.url?.toLowerCase().replace(/\/$/, '') !== '/recommendations')
            .map((sub) => {
              if (sub.url?.toLowerCase().replace(/\/$/, '') === '/patterns') {
                return {
                  ...sub,
                  label: 'Pola & Rekomendasi',
                  icon: 'fas fa-layer-group',
                };
              }
              return sub;
            });

          return {
            ...item,
            subMenus: filteredSub,
          };
        }

        return item;
      });
  }, [navigation]);

  // Ambil label judul halaman secara dinamis dari nama menu sidebar yang aktif
  const activeNavLabel = useMemo(() => {
    if (!navigation || !Array.isArray(navigation)) return null;

    const normalize = (raw) => {
      if (!raw || raw === '#') return '';
      let n = raw.toLowerCase().split('?')[0].replace(/\/$/, '');
      if (!n.startsWith('/')) n = '/' + n;
      return n;
    };

    const normCurrent = normalize(location.pathname);

    // 1. Cek exact match rute sidebar
    for (const item of navigation) {
      if (item.type === 'menu' && normalize(item.url) === normCurrent) {
        return item.label;
      }
      if (item.type === 'group' && Array.isArray(item.subMenus)) {
        for (const sub of item.subMenus) {
          if (normalize(sub.url) === normCurrent) {
            return sub.label;
          }
        }
      }
    }

    // 2. Cek prefix match jika URL memiliki sub-path
    for (const item of navigation) {
      const normItem = normalize(item.url);
      if (item.type === 'menu' && normItem && normCurrent.startsWith(normItem + '/')) {
        return item.label;
      }
      if (item.type === 'group' && Array.isArray(item.subMenus)) {
        for (const sub of item.subMenus) {
          const normSub = normalize(sub.url);
          if (normSub && normCurrent.startsWith(normSub + '/')) {
            return sub.label;
          }
        }
      }
    }

    return null;
  }, [navigation, location.pathname]);

  // 1. Jika belum login dan mencoba inject URL admin -> Error langsung (bukan web admin, bukan 404)
  if (!isAuthenticated) {
    return <ErrorPage />;
  }

  // 2. Jika navigasi masih memuat
  if (loadingNav) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <i className="fas fa-spinner fa-spin text-2xl text-[#1A396D] mb-3"></i>
        <span className="text-xs font-semibold ml-2">Memuat sesi...</span>
      </div>
    );
  }

  // 3. Jika login dan ternyata belum memiliki sidebar -> kasih UI 404
  if (!hasSidebarMenus) {
    return <NotFound />;
  }

  // 4. Jika user inject URL yang tidak ada izin -> Error aja websitenya (jgn kasih UI 404)
  const currentPath = location.pathname.toLowerCase().split('?')[0].replace(/\/$/, '');
  const isIndex =
    currentPath === '' ||
    currentPath === '/';
  const isRouteAllowed =
    isIndex ||
    allowedRoutes.has(currentPath) ||
    Array.from(allowedRoutes).some((url) => currentPath.startsWith(url + '/'));

  if (!isRouteAllowed) {
    return <ErrorPage />;
  }

  const getPageTitle = () => {
    if (activeNavLabel) return activeNavLabel;

    // Fallback jika rute tidak ditemukan di struktur sidebar navigasi
    const path = location.pathname.toLowerCase();
    if (path.includes('/patterns') || path.includes('/recommendations')) return 'Pola & Rekomendasi';
    if (path.includes('/menuroles')) return 'Kelola Menu Roles';
    if (path.includes('/roles')) return 'Master Roles';
    if (path.includes('/users')) return 'Master Users';
    if (path.includes('/menus')) return 'Master Menu';
    if (path.includes('/groups')) return 'Kelola Group Menu';
    return 'Dashboard';
  };

  const getSidebarClass = () => {
    if (isMobile) {
      return `sidebar ${mobileOpen ? 'mobile-open' : 'closed'}`;
    }
    return `sidebar ${desktopCollapsed ? 'collapsed' : ''}`;
  };

  const getTopbarClass = () => {
    if (isMobile) {
      return 'topbar';
    }
    return `topbar ${desktopCollapsed ? 'sidebar-collapsed' : ''}`;
  };

  const getMainContentClass = () => {
    if (isMobile) {
      return 'main-content';
    }
    return `main-content ${desktopCollapsed ? 'sidebar-collapsed' : ''}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans relative">
      {/* Sidebar */}
      <nav className={getSidebarClass()} id="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" title="FP GROW">
            <div className="brand-icon-box">
              <i className="fas fa-layer-group"></i>
            </div>
            <div className="brand-text-block" style={{ minWidth: 0, maxWidth: 165 }}>
              <h3
                className="brand-name"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}
                title="FP GROW"
              >
                FP GROW
              </h3>
            </div>
          </Link>
        </div>

        <div className="sidebar-nav-container" id="sidebarNav">
          {loadingNav ? (
            <div className="p-4 text-center text-xs text-slate-400">
              <i className="fas fa-spinner fa-spin text-[#1A396D] mr-2"></i>
              <span>Memuat menu...</span>
            </div>
          ) : processedNavigation && processedNavigation.length > 0 ? (
            processedNavigation.map((item, idx) => {
              if (item.type === 'group') {
                if (!item.subMenus || item.subMenus.length === 0) {
                  return null;
                }
                const currentPath = location.pathname.toLowerCase();
                const hasActiveChild = item.subMenus?.some(
                  (sub) => sub.url && (currentPath === sub.url.toLowerCase() || currentPath.startsWith(sub.url.toLowerCase() + '/'))
                );
                const isOpen =
                  openGroups[item.id] !== undefined
                    ? openGroups[item.id]
                    : (hasActiveChild || item.isOpenDefault !== false);

                return (
                  <div key={`group-${item.id || idx}`} className="sidebar-dropdown">
                    <button
                      type="button"
                      className={`sidebar-dropdown-toggle ${hasActiveChild ? 'active' : ''}`}
                      onClick={() => toggleGroup(item.id, isOpen)}
                      aria-expanded={isOpen ? 'true' : 'false'}
                      title={item.label}
                    >
                      <i className={`${item.icon || 'fas fa-folder'} link-icon`}></i>
                      <span className="sidebar-dropdown-label">{item.label}</span>
                      <i
                        className="fas fa-chevron-right dropdown-chevron"
                        style={{
                          transform: isOpen ? 'rotate(90deg)' : 'none',
                          color: isOpen ? '#93C5FD' : '#64748B',
                          transition: 'transform 0.2s ease, color 0.2s ease'
                        }}
                      ></i>
                    </button>

                    {isOpen && item.subMenus && (
                      <div className="sidebar-submenu">
                        {item.subMenus.map((sub, sIdx) => (
                          <NavLink
                            key={`sub-${sub.id || sIdx}`}
                            to={sub.url}
                            className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                            title={sub.label}
                            onClick={() => { if (isMobile) setMobileOpen(false); }}
                          >
                            <span>{sub.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Standalone Menu Item
              return (
                <NavLink
                  key={`menu-${item.id || idx}`}
                  to={item.url}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  title={item.label}
                  onClick={() => { if (isMobile) setMobileOpen(false); }}
                >
                  <i className={`${item.icon || 'fas fa-circle-dot'} link-icon`}></i>
                  <span>{item.label}</span>
                </NavLink>
              );
            })
          ) : null}
        </div>

        {/* Sidebar Bottom */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="btn-sidebar-exit-wide"
            title="Keluar dari Sistem"
            onClick={handleLogout}
          >
            <i className="fas fa-arrow-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Topbar */}
      <header className={getTopbarClass()}>
        <div className="topbar-left">
          <button
            type="button"
            className="btn-menu-toggle"
            id="menuToggle"
            aria-label="Toggle Sidebar"
            title={desktopCollapsed ? "Buka Sidebar Penuh" : "Kecilkan Sidebar (Icon Only)"}
            onClick={handleToggleSidebar}
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="topbar-page-label">
            <h2 className="topbar-page-title">{getPageTitle()}</h2>
          </div>
        </div>

        <div className="topbar-right">
          <div className="relative">
            <div
              className="topbar-user-card cursor-pointer"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title="Informasi Akun"
            >
              <div className="topbar-user-avatar">
                {user?.namaLengkap ? user.namaLengkap.substring(0, 2).toUpperCase() : 'SA'}
              </div>
              <div className="topbar-user-meta">
                <div className="topbar-user-name" title={user?.namaLengkap || 'Super Administrator'}>
                  {user?.namaLengkap || 'Super Administrator'}
                </div>
                <div className="topbar-user-role">
                  <span className="role-status-dot"></span>
                  <span>{user?.roleName || 'Super Admin'}</span>
                </div>
              </div>
            </div>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-800">{user?.namaLengkap || 'Administrator'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@test.com'}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                >
                  <i className="fas fa-arrow-right-from-bracket"></i>
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={getMainContentClass()} id="mainContent">
        <Outlet context={{ pageTitle: getPageTitle() }} />
      </div>

      {/* Mobile Overlay Backdrop (HANYA tampil di layar HP/Tablet saat sidebar dibuka) */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay-backdrop show"
          id="sidebarOverlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
