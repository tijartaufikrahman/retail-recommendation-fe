import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, menuRoleService } from '../services/api';
import { getFirstMenuUrl } from '../utils/navigation';
import { getCookie, setCookie, removeCookie } from '../utils/cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Validasi bahwa token JWT tersedia di cookie atau storage
    const token = getCookie('token') || localStorage.getItem('token');
    if (!token) return null;
    return authService.getCurrentUser();
  });
  const [navigation, setNavigation] = useState([]);
  const [loadingNav, setLoadingNav] = useState(false);

  const fetchNavigation = useCallback(async (roleId) => {
    const parsedId = Number(roleId);
    if (!parsedId || parsedId <= 0) {
      setNavigation([]);
      return [];
    }
    setLoadingNav(true);
    try {
      const data = await menuRoleService.getNavigation(parsedId);
      const navList = Array.isArray(data) ? data : (data?.data || []);
      setNavigation(navList);
      return navList;
    } catch (err) {
      console.error('Gagal memuat navigasi role:', err);
      setNavigation([]);
      return [];
    } finally {
      setLoadingNav(false);
    }
  }, []);

  const userRoleId = user?.roleId;

  useEffect(() => {
    if (userRoleId && Number(userRoleId) > 0) {
      fetchNavigation(userRoleId);
    } else {
      setNavigation([]);
    }
  }, [userRoleId, fetchNavigation]);

  const login = async (userData, token) => {
    if (token) {
      setCookie('token', token, 1);
      localStorage.setItem('token', token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData && Number(userData.roleId) > 0) {
      const navList = await fetchNavigation(userData.roleId);
      return getFirstMenuUrl(navList);
    } else {
      setNavigation([]);
      return null;
    }
  };

  const logout = () => {
    removeCookie('token');
    authService.logout();
    setUser(null);
    setNavigation([]);
  };

  const refreshNavigation = () => {
    if (user?.roleId) {
      return fetchNavigation(user.roleId);
    }
  };

  const firstMenuUrl = getFirstMenuUrl(navigation);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        navigation,
        loadingNav,
        refreshNavigation,
        firstMenuUrl,
        getFirstMenuUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
