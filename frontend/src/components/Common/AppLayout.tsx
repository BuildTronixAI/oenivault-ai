import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cellar-radial">
        <p className="animate-fade-in font-display text-2xl text-gold-400">OeniVault</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-cellar-radial">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="hidden md:block" />
        <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
