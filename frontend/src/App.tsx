import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/Common/AppLayout';
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

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
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
      <Route
        path="/accept-invite"
        element={
          <GuestOnly>
            <AcceptInvitePage />
          </GuestOnly>
        }
      />
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
