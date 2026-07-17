import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { BrandMark } from './BrandMark';
import { Sidebar } from './Sidebar';

export function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-cellar-700/70 bg-cellar-950/70 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-cellar-600 px-2.5 py-1.5 text-sm text-parchment-100 transition hover:border-gold-500/40 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
          <Link to="/dashboard" className="group">
            <BrandMark size="sm" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-parchment-50">{user?.full_name}</p>
            <p className="text-xs capitalize tracking-wide text-parchment-200/55">{user?.role}</p>
          </div>
          <button type="button" onClick={() => void logout()} className="btn-secondary !py-1.5 !text-xs">
            Sign out
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-cellar-700 md:hidden animate-fade-in">
          <Sidebar className="w-full border-r-0" onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
