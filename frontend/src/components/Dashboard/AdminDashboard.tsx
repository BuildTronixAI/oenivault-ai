import { Link } from 'react-router-dom';
import { useInventory } from '../../hooks/useInventory';
import { useClimate } from '../../hooks/useClimate';
import { apiRequest } from '../../services/api';
import { useEffect, useState } from 'react';
import type { User } from '../../types';

function formatValue(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function AdminDashboard() {
  const { wines, collections, loading } = useInventory();
  const { alerts } = useClimate();
  const [customers, setCustomers] = useState<User[]>([]);

  useEffect(() => {
    void apiRequest<{ customers: User[] }>('/api/customers')
      .then((res) => setCustomers(res.customers))
      .catch(() => setCustomers([]));
  }, []);

  const totalValue = wines.reduce((sum, w) => {
    const v = Number(w.estimated_value ?? 0) * w.quantity;
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-semibold text-parchment-50 md:text-4xl">Facility overview</h1>
        <p className="mt-1 text-parchment-200/65">All collections, customers, and inventory at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Customers" value={String(customers.length)} />
        <Stat label="Collections" value={String(collections.length)} />
        <Stat label="Est. inventory value" value={loading ? '…' : formatValue(totalValue)} />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl text-gold-300">Recent collections</h2>
          <Link to="/customers" className="text-sm text-gold-400 hover:underline">
            Manage customers
          </Link>
        </div>
        <div className="overflow-x-auto rounded-md border border-cellar-700">
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
                <tr key={c.id} className="border-t border-cellar-700/80">
                  <td className="px-4 py-3 text-parchment-50">{c.name}</td>
                  <td className="px-4 py-3 text-parchment-200/70">{c.customer_name ?? '—'}</td>
                  <td className="px-4 py-3">{c.wine_count ?? 0}</td>
                  <td className="px-4 py-3">{formatValue(Number(c.total_value ?? 0))}</td>
                </tr>
              ))}
              {!loading && collections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-parchment-200/50">
                    No collections yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {alerts.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl text-gold-300">Active alerts</h2>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="border-l-2 border-burgundy-500 bg-cellar-800/50 px-4 py-3 text-sm">
                <span className="font-medium capitalize text-burgundy-400">{a.severity}</span>
                <span className="ml-2 text-parchment-200/80">{a.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-cellar-600 pb-3">
      <p className="text-xs uppercase tracking-wider text-parchment-200/50">{label}</p>
      <p className="mt-1 font-display text-3xl text-parchment-50">{value}</p>
    </div>
  );
}
