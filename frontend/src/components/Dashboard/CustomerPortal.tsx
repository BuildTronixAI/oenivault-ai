import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import { ClimateMonitor } from './ClimateMonitor';
import { formatMoney } from '../../utils/format';
import { PageHeader } from '../Common/PageHeader';
import { EmptyState } from '../Common/EmptyState';

export function CustomerPortal() {
  const { user } = useAuth();
  const { wines, collections, loading, error } = useInventory();

  const totalValue = wines.reduce((sum, w) => sum + Number(w.estimated_value ?? 0) * w.quantity, 0);
  const bottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] ?? 'Collector'}`}
        description="Your private collection at the vault."
        actions={
          <Link to="/inventory" className="btn-primary">
            Manage inventory
          </Link>
        }
      />

      {error && (
        <div className="rounded-md border border-burgundy-500/40 bg-burgundy-700/20 px-4 py-3 text-sm text-burgundy-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-parchment-200/50">Collections</p>
          <p className="mt-1 font-display text-3xl">{collections.length}</p>
        </div>
        <div className="panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-parchment-200/50">Bottles</p>
          <p className="mt-1 font-display text-3xl">{loading ? '…' : bottles}</p>
        </div>
        <div className="panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-parchment-200/50">Est. value</p>
          <p className="mt-1 font-display text-3xl">{loading ? '…' : formatMoney(totalValue)}</p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl text-gold-300">Your wines</h2>
          <Link to="/inventory" className="text-sm text-gold-400 hover:underline">
            View full inventory
          </Link>
        </div>
        <div className="panel">
          {wines.length > 0 ? (
            <ul className="divide-y divide-cellar-700/80">
              {wines.slice(0, 6).map((w) => (
                <li key={w.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium text-parchment-50">{w.name}</p>
                    <p className="text-sm text-parchment-200/55">
                      {[w.vintage, w.region, w.varietal].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="text-sm text-gold-400">
                    {w.quantity}× · {w.location_code ?? 'Unassigned'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            !loading && (
              <EmptyState
                title="Your cellar is empty"
                description="Add a collection, then your first bottle — climate monitoring is ready when you are."
                action={
                  <Link to="/inventory" className="btn-primary">
                    Start inventory
                  </Link>
                }
              />
            )
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl text-gold-300">Vault climate</h2>
          <Link to="/climate" className="text-sm text-gold-400 hover:underline">
            Details
          </Link>
        </div>
        <ClimateMonitor compact />
      </section>
    </div>
  );
}
