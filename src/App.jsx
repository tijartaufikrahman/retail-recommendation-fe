import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Authentication Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Shell & Feature Pages
import DashboardLayout from './components/DashboardLayout';
import Users from './pages/users/Users';
import Roles from './pages/roles/Roles';
import Menus from './pages/menus/Menus';
import Groups from './pages/groups/Groups';
import MenuRoles from './pages/menuroles/MenuRoles';

// Retail & FP-Growth Feature Pages (Matching Python UI exactly)
import Dashboard from './pages/dashboard/Dashboard';
import Pos from './pages/pos/Pos';
import Categories from './pages/categories/Categories';
import Products from './pages/products/Products';
import Transactions from './pages/transactions/Transactions';
import Patterns from './pages/analysis/Patterns';
import Recommendations from './pages/analysis/Recommendations';

import ErrorPage from './pages/ErrorPage';

// Root Route: Automatically redirects to first menu if authenticated, or login if not
function RootRoute() {
  const { isAuthenticated, firstMenuUrl, loadingNav } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loadingNav) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <i className="fas fa-spinner fa-spin text-2xl text-[#1A396D]"></i>
      </div>
    );
  }
  return <Navigate to={firstMenuUrl || '/dashboard'} replace />;
}

// Public Route Guard: If user is already logged in, redirect them away from login
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, firstMenuUrl } = useAuth();
  return isAuthenticated ? <Navigate to={firstMenuUrl || '/dashboard'} replace /> : children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Root URL (http://localhost:5173/) goes straight to login or first menu */}
        <Route path="/" element={<RootRoute />} />

        {/* Authentication Flow */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Workspace Management Panel (Direct Clean URLs) */}
        <Route element={<DashboardLayout />}>
          {/* Developer / System Master Data */}
          <Route path="/users" element={<Users />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/menuroles" element={<MenuRoles />} />

          {/* Retail Management & FP-Growth Routes (Matching Python UI) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<Pos />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/recommendations" element={<Navigate to="/patterns" replace />} />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
