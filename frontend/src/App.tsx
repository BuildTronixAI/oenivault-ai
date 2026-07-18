import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/Common/AppLayout';
import { BrandLoader } from './components/Common/BrandLoader';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClimatePage } from './pages/ClimatePage';
import { ReportsPage } from './pages/ReportsPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useToast } from './context/ToastContext';

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <BrandLoader label="Checking session…" />;
  if (isAuthenticated) {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    return <Navigate to={next && next.startsWith('/') ? next : '/dashboard'} replace />;
  }
  return children;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <BrandLoader />;
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace state={{ accessDenied: true }} />;
  }
  return children;
}

function SessionExpiryListener() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { pushToast } = useToast();

  useEffect(() => {
    function onExpired() {
      void logout().finally(() => {
        const next = `${window.location.pathname}${window.location.search}`;
        pushToast('Session expired — please sign in again.', 'alert');
        navigate(`/login?reason=expired&next=${encodeURIComponent(next)}`, { replace: true });
      });
    }
    window.addEventListener('oeni:session-expired', onExpired);
    return () => window.removeEventListener('oeni:session-expired', onExpired);
  }, [logout, navigate, pushToast]);

  return null;
}

export default function App() {
  return (
    <>
      <SessionExpiryListener />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <SignupPage />
            </GuestOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPasswordPage />
            </GuestOnly>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestOnly>
              <ResetPasswordPage />
            </GuestOnly>
          }
        />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/climate" element={<ClimatePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route
            path="/customers"
            element={
              <AdminOnly>
                <CustomersPage />
              </AdminOnly>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
