import axios from 'axios';
import { getCookie, setCookie, removeCookie } from '../utils/cookie';

// Base URL Rest API .NET
const API_BASE_URL = 'http://localhost:5253/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Sertakan cookies pada setiap request HTTP
});

// Interceptor request: Menambahkan token JWT dari cookie ke Authorization header
api.interceptors.request.use(
  (config) => {
    // Ambil token dari cookie (prioritas utama) atau fallback ke localStorage
    const token = getCookie('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response: Menangani respons 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token kedaluwarsa atau tidak sah -> bersihkan cookie dan sesi lokal
      removeCookie('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/Auth/login', { email, password });
    const resData = response.data;
    const token = resData?.data?.token || resData?.token;
    if (token) {
      // Simpan token JWT ke cookies dengan masa kedaluwarsa 1 hari (24 jam)
      setCookie('token', token, 1);
      localStorage.setItem('token', token);
    }
    if (resData && resData.data && resData.data.user) {
      resData.user = resData.data.user;
    }
    return resData;
  },
  sendOtp: async (email) => {
    const response = await api.post('/Auth/send-otp', { email });
    return response.data;
  },
  verifyOtp: async (email, otp) => {
    const response = await api.post('/Auth/verify-otp', { email, otp });
    return response.data;
  },
  resetPasswordOtp: async (email, otp, newPassword, confirmPassword) => {
    const response = await api.post('/Auth/reset-password-otp', {
      email,
      otp,
      newPassword,
      confirmPassword: confirmPassword || newPassword,
    });
    return response.data;
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  getProfile: async () => {
    const response = await api.get('/Auth/me');
    return response.data;
  },
  logout: () => {
    try {
      api.post('/Auth/logout');
    } catch {
      // Ignore if offline
    }
    removeCookie('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
};

export const userService = {
  getAll: async () => {
    const res = await api.get('/Users');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getCount: async () => {
    const res = await api.get('/Users/count');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  create: async (data) => {
    const formData = new FormData();
    formData.append('NamaLengkap', data.namaLengkap);
    formData.append('Email', data.email);
    formData.append('PasswordHash', data.password);
    formData.append('ConfirmPassword', data.password);
    if (data.roleId) {
      formData.append('RoleId', data.roleId);
    }
    formData.append('IsActive', data.isActive !== undefined ? data.isActive : true);

    // Generate WIB (UTC+7) code format ddMMyyyyHHmmss
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 3600000);
    const pad = (n) => String(n).padStart(2, '0');
    const code = `${pad(wib.getDate())}${pad(wib.getMonth() + 1)}${wib.getFullYear()}${pad(wib.getHours())}${pad(wib.getMinutes())}${pad(wib.getSeconds())}`;
    formData.append('Code', code);

    const res = await api.post('/Users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  update: async (id, data) => {
    const formData = new FormData();
    formData.append('Id', id);
    formData.append('NamaLengkap', data.namaLengkap);
    formData.append('Email', data.email);
    if (data.roleId) {
      formData.append('RoleId', data.roleId);
    }
    formData.append('IsActive', data.isActive !== undefined ? data.isActive : true);
    if (data.password) {
      formData.append('Password', data.password);
    }

    const res = await api.put(`/Users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/Users/${id}`);
    return res.data;
  },
};

export const roleService = {
  getAll: async () => {
    const res = await api.get('/Roles');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getCount: async () => {
    const res = await api.get('/Roles/count');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  create: async (data) => {
    const formData = new FormData();
    formData.append('NamaRole', data.namaRole);
    formData.append('Deskripsi', data.deskripsi || '');
    if (data.isActive !== undefined) {
      formData.append('IsActive', data.isActive);
    }

    const res = await api.post('/Roles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  update: async (id, data) => {
    const formData = new FormData();
    formData.append('Id', id);
    formData.append('NamaRole', data.namaRole);
    formData.append('Deskripsi', data.deskripsi || '');
    if (data.isActive !== undefined) {
      formData.append('IsActive', data.isActive);
    }

    const res = await api.put(`/Roles/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/Roles/${id}`);
    return res.data;
  },
};

export const menuService = {
  getAll: async () => {
    const res = await api.get('/Menus');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getCount: async () => {
    const res = await api.get('/Menus/count');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/Menus/${id}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  create: async (data) => {
    const res = await api.post('/Menus', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/Menus/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/Menus/${id}`);
    return res.data;
  },
};

export const groupService = {
  getAll: async () => {
    const res = await api.get('/Groups');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getCount: async () => {
    const res = await api.get('/Groups/count');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/Groups/${id}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  create: async (data) => {
    const res = await api.post('/Groups', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/Groups/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/Groups/${id}`);
    return res.data;
  },
  addMenuToGroup: async (groupId, menuId, orderIndex = 0) => {
    const res = await api.post(`/Groups/${groupId}/menus`, { menuId, orderIndex });
    return res.data;
  },
  removeMenuFromGroup: async (groupId, menuId) => {
    const res = await api.delete(`/Groups/${groupId}/menus/${menuId}`);
    return res.data;
  },
  toggleDefaultOpen: async (id, isOpen) => {
    const res = await api.post(`/Groups/${id}/toggle-default-open?isOpen=${isOpen}`);
    return res.data;
  },
};

export const menuRoleService = {
  getAll: async () => {
    const res = await api.get('/MenuRoles');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getCount: async () => {
    const res = await api.get('/MenuRoles/count');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getByRole: async (roleId) => {
    const res = await api.get(`/MenuRoles/role/${roleId}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getNavigation: async (roleId) => {
    const res = await api.get(`/MenuRoles/navigation/${roleId}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  assign: async (data) => {
    const res = await api.post('/MenuRoles', data);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/MenuRoles', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/MenuRoles/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/MenuRoles/${id}`);
    return res.data;
  },
};

export const categoryService = {
  getAll: async () => {
    const res = await api.get('/Categories');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/Categories/${id}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  create: async (data) => {
    const res = await api.post('/Categories', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/Categories/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/Categories/${id}`);
    return res.data;
  },
};

export const productService = {
  getAll: async (params = {}) => {
    const res = await api.get('/Products', { params });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/Products/${id}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  create: async (data) => {
    const res = await api.post('/Products', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/Products/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/Products/${id}`);
    return res.data;
  },
};

export const transactionService = {
  getAll: async (limit = 50) => {
    const res = await api.get('/Transactions', { params: { limit } });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/Transactions/${id}`);
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  checkout: async (data) => {
    const res = await api.post('/Transactions/checkout', data);
    return res.data;
  },
  getSummary: async () => {
    const res = await api.get('/Transactions/summary');
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
};

export const analysisService = {
  getPatterns: async (params = {}) => {
    const res = await api.get('/Analysis/patterns', { params });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  getRecommendations: async (params = {}) => {
    const res = await api.get('/Analysis/recommendations', { params });
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
};

export default api;
