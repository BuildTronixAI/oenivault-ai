import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-burgundy-700/40 text-gold-300'
      : 'text-parchment-200/70 hover:bg-cellar-800 hover:text-parchment-50'
  }`;

export function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-cellar-700/80 bg-cellar-900/60 p-4 md:block">
      <nav className="flex flex-col gap-1">
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/inventory" className={linkClass}>
          Inventory
        </NavLink>
        {isAdmin && (
          <NavLink to="/customers" className={linkClass}>
            Customers
          </NavLink>
        )}
        <NavLink to="/settings" className={linkClass}>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
