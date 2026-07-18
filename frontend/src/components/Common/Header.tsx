import { Link } from 'react-router-dom';
import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { BrandMark } from './BrandMark';
import { Sidebar } from './Sidebar';

function roleLabel(role?: string | null) {
  if (role === 'admin') return 'Facility admin';
  if (role === 'customer') return 'Collector';
  return role ?? '';
}

export function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    const firstLink = panelRef.current?.querySelector<HTMLElement>('a, button');
    firstLink?.focus();

    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="relative z-20 border-b border-cellar-700/70 bg-cellar-950/70 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            ref={buttonRef}
            type="button"
            className="rounded-md border border-cellar-600 px-2.5 py-1.5 text-sm text-parchment-100 transition hover:border-gold-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <Link to="/dashboard" className="group">
            <BrandMark size="sm" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-parchment-50">{user?.full_name}</p>
            <p className="text-xs tracking-wide text-parchment-200/55">{roleLabel(user?.role)}</p>
          </div>
          <button type="button" onClick={() => void logout()} className="btn-secondary !py-1.5 !text-xs">
            Sign out
          </button>
        </div>
      </div>
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-cellar-950/60 md:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id={menuId}
            ref={panelRef}
            className="relative z-40 border-t border-cellar-700 md:hidden animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
          >
            <Sidebar className="w-full border-r-0 bg-cellar-950" onNavigate={() => setMenuOpen(false)} />
          </div>
        </>
      )}
    </header>
  );
}
