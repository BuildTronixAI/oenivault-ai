import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import { ClimateMonitor } from './ClimateMonitor';

function formatValue(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function CustomerPortal() {
  const { user } = useAuth();
  const { wines, collections, loading } = useInventory();

  const totalValue = wines.reduce((sum, w) => sum + Number(w.estimated_value ?? 0) * w.quantity, 0);
  const bottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-semibold text-parchment-50 md:text-4xl">
          Welcome, {user?.full_name?.split(' ')[0] ?? 'Collector'}
        </h1>
        <p className="mt-1 text-parchment-200/65">Your private collection at the vault.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-b border-cellar-600 pb-3">
          <p className="text-xs uppercase tracking-wider text-parchment-200/50">Collections</p>
          <p className="mt-1 font-display text-3xl">{collections.length}</p>
        </div>
        <div className="border-b border-cellar-600 pb-3">
          <p className="text-xs uppercase tracking-wider text-parchment-200/50">Bottles</p>
          <p className="mt-1 font-display text-3xl">{loading ? '…' : bottles}</p>
        </div>
        <div className="border-b border-cellar-600 pb-3">
          <p className="text-xs uppercase tracking-wider text-parchment-200/50">Est. value</p>
          <p className="mt-1 font-display text-3xl">{loading ? '…' : formatValue(totalValue)}</p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl text-gold-300">Your wines</h2>
          <Link to="/inventory" className="text-sm text-gold-400 hover:underline">
            View full inventory
          </Link>
        </div>
        <ul className="divide-y divide-cellar-700/80 border-y border-cellar-700/80">
          {wines.slice(0, 6).map((w) => (
            <li key={w.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
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
          {!loading && wines.length === 0 && (
            <li className="space-y-3 py-8 text-center">
              <p className="text-parchment-200/60">Your cellar is empty — get started:</p>
              <ol className="mx-auto max-w-sm space-y-2 text-left text-sm text-parchment-200/70">
                <li className="flex gap-2">
                  <span className="text-gold-400">1.</span>
                  <span>
                    <Link to="/inventory" className="text-gold-400 hover:underline">
                      Add a collection
                    </Link>{' '}
                    to organize bottles
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gold-400">2.</span>
                  <span>
                    <Link to="/inventory" className="text-gold-400 hover:underline">
                      Add a wine
                    </Link>{' '}
                    to your inventory
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gold-400">3.</span>
                  <span>
                    <Link to="/climate" className="text-gold-400 hover:underline">
                      View climate
                    </Link>{' '}
                    for your vault conditions
                  </span>
                </li>
              </ol>
            </li>
          )}
        </ul>
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
