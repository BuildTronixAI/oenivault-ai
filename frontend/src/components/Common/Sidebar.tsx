import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link ${isActive ? 'nav-link-active' : ''}`;

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className = '' }: SidebarProps) {
  const { isAdmin } = useAuth();

  return (
    <aside
      className={`w-56 shrink-0 border-r border-cellar-700/70 bg-cellar-950/40 p-4 backdrop-blur-sm ${className}`}
    >
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-parchment-200/40">
        Vault
      </p>
      <nav className="flex flex-col gap-1" onClick={onNavigate}>
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/inventory" className={linkClass}>
          Inventory
        </NavLink>
        <NavLink to="/climate" className={linkClass}>
          Climate
        </NavLink>
        <NavLink to="/reports" className={linkClass}>
          Reports
        </NavLink>
        {isAdmin && (
          <>
            <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-parchment-200/40">
              Operations
            </p>
            <NavLink to="/customers" className={linkClass}>
              Customers
            </NavLink>
          </>
        )}
        <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-parchment-200/40">
          Account
        </p>
        <NavLink to="/settings" className={linkClass}>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
