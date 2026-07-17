import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-cellar-700/80 bg-cellar-900/80 px-4 backdrop-blur md:px-6">
      <Link to="/dashboard" className="font-display text-2xl font-semibold tracking-wide text-gold-400">
        OeniVault <span className="text-parchment-100">AI</span>
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-parchment-50">{user?.full_name}</p>
          <p className="text-xs capitalize text-parchment-200/60">{user?.role}</p>
        </div>
        <button type="button" onClick={() => void logout()} className="btn-secondary !py-1.5 !text-xs">
          Sign out
        </button>
      </div>
    </header>
  );
}
