import { Link } from 'react-router-dom';
import { useInventory } from '../../hooks/useInventory';
import { useClimate } from '../../hooks/useClimate';
import { ClimateMonitor } from './ClimateMonitor';
import { apiRequest } from '../../services/api';
import { useEffect, useState } from 'react';
import type { User } from '../../types';
import { formatMoney } from '../../utils/format';
import { PageHeader } from '../Common/PageHeader';
import { EmptyState } from '../Common/EmptyState';

export function AdminDashboard() {
  const { wines, collections, loading, error: inventoryError } = useInventory();
  const { alerts } = useClimate();
  const [customers, setCustomers] = useState<User[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);

  useEffect(() => {
    void apiRequest<{ customers: User[] }>('/api/customers')
      .then((res) => {
        setCustomers(res.customers);
        setCustomersError(null);
      })
      .catch((err) => {
        setCustomers([]);
        setCustomersError(err instanceof Error ? err.message : 'Failed to load customers');
      });
  }, []);

  const totalValue = wines.reduce((sum, w) => {
    const v = Number(w.estimated_value ?? 0) * w.quantity;
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Facility overview"
        description="All collections, customers, and inventory at a glance."
        actions={
          <Link to="/customers" className="btn-secondary">
            Manage customers
          </Link>
        }
      />

      {(inventoryError || customersError) && (
        <div className="rounded-md border border-burgundy-500/40 bg-burgundy-700/20 px-4 py-3 text-sm text-burgundy-400">
          {[inventoryError, customersError].filter(Boolean).join(' · ')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Customers" value={String(customers.length)} />
        <Stat label="Collections" value={String(collections.length)} />
        <Stat label="Est. inventory value" value={loading ? '…' : formatMoney(totalValue)} />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl text-gold-300">Recent collections</h2>
          <Link to="/inventory" className="text-sm text-gold-400 hover:underline">
            Open inventory
          </Link>
        </div>
        <div className="panel overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cellar-800/80 text-xs uppercase tracking-wide text-parchment-200/50">
              <tr>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Wines</th>
                <th className="px-4 py-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {collections.slice(0, 8).map((c) => (
                <tr key={c.id} className="border-t border-cellar-700/80 transition hover:bg-cellar-800/40">
                  <td className="px-4 py-3 text-parchment-50">{c.name}</td>
                  <td className="px-4 py-3 text-parchment-200/70">{c.customer_name ?? '—'}</td>
                  <td className="px-4 py-3">{c.wine_count ?? 0}</td>
                  <td className="px-4 py-3">{formatMoney(Number(c.total_value ?? 0))}</td>
                </tr>
              ))}
              {!loading && collections.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No collections yet"
                      description="Invite a customer or create a collection to populate the vault."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {alerts.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl text-gold-300">Active alerts</h2>
            <Link to="/climate" className="text-sm text-gold-400 hover:underline">
              Open climate
            </Link>
          </div>
          <ul className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="border-l-2 border-burgundy-500 bg-cellar-800/50 px-4 py-3 text-sm"
              >
                <span className="font-medium capitalize text-burgundy-400">{a.severity}</span>
                <span className="ml-2 text-parchment-200/80">{a.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl text-gold-300">Climate snapshot</h2>
          <Link to="/climate" className="text-sm text-gold-400 hover:underline">
            Full monitor
          </Link>
        </div>
        <ClimateMonitor compact />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-4 py-4 transition duration-200 hover:border-gold-500/30">
      <p className="text-xs uppercase tracking-wider text-parchment-200/50">{label}</p>
      <p className="mt-1 font-display text-3xl text-parchment-50">{value}</p>
    </div>
  );
}
