import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ClimateProvider } from '../../hooks/useClimate';
import { BrandLoader } from './BrandLoader';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <BrandLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ClimateProvider>
      <div className="relative flex min-h-screen flex-col bg-cellar-radial">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-cellar-lattice" />
        <Header />
        <div className="relative flex flex-1">
          <Sidebar className="hidden md:block" />
          <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>
        <Footer />
      </div>
    </ClimateProvider>
  );
}
