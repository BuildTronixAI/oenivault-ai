import { useAuth } from '../hooks/useAuth';
import { AdminDashboard } from '../components/Dashboard/AdminDashboard';
import { CustomerPortal } from '../components/Dashboard/CustomerPortal';

export function DashboardPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <CustomerPortal />;
}
