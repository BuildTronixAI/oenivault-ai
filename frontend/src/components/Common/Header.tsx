import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from './Sidebar';

export function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-cellar-700/80 bg-cellar-900/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-cellar-600 px-2.5 py-1.5 text-sm text-parchment-100 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
          <Link to="/dashboard" className="font-display text-2xl font-semibold tracking-wide text-gold-400">
            OeniVault <span className="text-parchment-100">AI</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-parchment-50">{user?.full_name}</p>
            <p className="text-xs capitalize text-parchment-200/60">{user?.role}</p>
          </div>
          <button type="button" onClick={() => void logout()} className="btn-secondary !py-1.5 !text-xs">
            Sign out
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-cellar-700 md:hidden">
          <Sidebar className="w-full border-r-0" onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
