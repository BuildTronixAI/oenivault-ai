import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, downloadBlob } from '../services/api';
import { formatMoney } from '../utils/format';
import { PageHeader } from '../components/Common/PageHeader';

interface InventoryReport {
  totals: {
    wine_count: number;
    bottle_count: number;
    total_value: string | number;
    region_count: number;
    varietal_count: number;
  };
  byRegion: Array<{ region: string; wines: number; bottles: number; value: string | number }>;
  byVarietal: Array<{ varietal: string; wines: number; bottles: number; value: string | number }>;
  byVintage: Array<{ vintage: number | null; wines: number; bottles: number; value: string | number }>;
}

interface ValueReport {
  grandTotal: number;
  collections: Array<{
    id: string;
    name: string;
    customer_name: string | null;
    wine_count: number;
    bottle_count: number;
    total_value: string | number;
  }>;
  topWines: Array<{
    id: string;
    name: string;
    vintage: number | null;
    region: string | null;
    quantity: number;
    line_value: string | number;
    collection_name: string;
  }>;
}

interface ClimateReport {
  days: number;
  trends: Array<{
    bucket: string;
    avg_temp: string | null;
    avg_humidity: string | null;
    min_temp: string | null;
    max_temp: string | null;
    alert_readings: number;
  }>;
  alertStats: Array<{ severity: string; count: number }>;
  latest: Array<{
    sensor_name: string | null;
    location: string | null;
    temperature: string | null;
    humidity: string | null;
    timestamp: string | null;
  }>;
}

function money(n: string | number | null | undefined) {
  return formatMoney(Number(n ?? 0));
}

export function ReportsPage() {
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [value, setValue] = useState<ValueReport | null>(null);
  const [climate, setClimate] = useState<ClimateReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [inv, val, clim] = await Promise.all([
          apiRequest<{ report: InventoryReport }>('/api/reports/inventory'),
          apiRequest<{ report: ValueReport }>('/api/reports/value'),
          apiRequest<{ report: ClimateReport }>('/api/reports/climate?days=7'),
        ]);
        setInventory(inv.report);
        setValue(val.report);
        setClimate(clim.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function exportFile(format: 'csv' | 'pdf') {
    await downloadBlob(`/api/reports/export/${format}`, `oenivault-inventory.${format}`);
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-cellar-800/70" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-burgundy-500/40 bg-burgundy-700/20 px-4 py-3 text-sm text-burgundy-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <PageHeader
        title="Reports"
        description="Inventory mix, collection value, and climate trends."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => void exportFile('csv')}>
              Export CSV
            </button>
            <button type="button" className="btn-secondary" onClick={() => void exportFile('pdf')}>
              Export PDF
            </button>
            <Link to="/inventory" className="btn-primary">
              Open inventory
            </Link>
          </>
        }
      />

      {inventory && (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-gold-300">Inventory summary</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Wines" value={String(inventory.totals.wine_count)} />
            <Stat label="Bottles" value={String(inventory.totals.bottle_count)} />
            <Stat label="Est. value" value={money(inventory.totals.total_value)} />
            <Stat label="Regions" value={String(inventory.totals.region_count)} />
            <Stat label="Varietals" value={String(inventory.totals.varietal_count)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Breakdown title="By region" rows={inventory.byRegion.map((r) => ({ label: r.region, bottles: r.bottles, value: r.value }))} />
            <Breakdown title="By varietal" rows={inventory.byVarietal.map((r) => ({ label: r.varietal, bottles: r.bottles, value: r.value }))} />
          </div>
        </section>
      )}

      {value && (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-gold-300">Collection value</h2>
          <p className="font-display text-3xl text-parchment-50">{money(value.grandTotal)}</p>
          <div className="overflow-x-auto rounded-md border border-cellar-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-cellar-800/80 text-xs uppercase tracking-wide text-parchment-200/50">
                <tr>
                  <th className="px-4 py-3">Collection</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Bottles</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {value.collections.map((c) => (
                  <tr key={c.id} className="border-t border-cellar-700/80">
                    <td className="px-4 py-3 text-parchment-50">{c.name}</td>
                    <td className="px-4 py-3 text-parchment-200/70">{c.customer_name ?? '—'}</td>
                    <td className="px-4 py-3">{c.bottle_count}</td>
                    <td className="px-4 py-3">{money(c.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-display text-lg text-gold-300">Top wines by line value</h3>
          <ul className="divide-y divide-cellar-700/80 border-y border-cellar-700/80">
            {value.topWines.map((w) => (
              <li key={w.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-parchment-50">{w.name}</p>
                  <p className="text-parchment-200/50">
                    {[w.vintage, w.region, w.collection_name].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <p className="text-gold-400">
                  {w.quantity}× · {money(w.line_value)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {climate && (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-gold-300">Climate ({climate.days}d)</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {climate.alertStats.map((a) => (
              <p key={a.severity} className="capitalize text-parchment-200/70">
                <span className="text-burgundy-400">{a.severity}</span>: {a.count}
              </p>
            ))}
            {climate.alertStats.length === 0 && (
              <p className="text-parchment-200/50">No alerts in this window.</p>
            )}
          </div>
          <div className="overflow-x-auto rounded-md border border-cellar-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-cellar-800/80 text-xs uppercase tracking-wide text-parchment-200/50">
                <tr>
                  <th className="px-4 py-3">Hour</th>
                  <th className="px-4 py-3">Avg °F</th>
                  <th className="px-4 py-3">Min/Max</th>
                  <th className="px-4 py-3">Avg RH</th>
                  <th className="px-4 py-3">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {climate.trends.slice(-24).map((t) => (
                  <tr key={t.bucket} className="border-t border-cellar-700/80">
                    <td className="px-4 py-2 text-parchment-200/70">
                      {new Date(t.bucket).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{t.avg_temp ?? '—'}</td>
                    <td className="px-4 py-2">
                      {t.min_temp ?? '—'} / {t.max_temp ?? '—'}
                    </td>
                    <td className="px-4 py-2">{t.avg_humidity ?? '—'}</td>
                    <td className="px-4 py-2">{t.alert_readings}</td>
                  </tr>
                ))}
                {climate.trends.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-parchment-200/50">
                      No climate history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-cellar-600 pb-3">
      <p className="text-xs uppercase tracking-wider text-parchment-200/50">{label}</p>
      <p className="mt-1 font-display text-2xl text-parchment-50">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; bottles: number; value: string | number }>;
}) {
  return (
    <div>
      <h3 className="mb-2 font-display text-lg text-parchment-100">{title}</h3>
      <ul className="divide-y divide-cellar-700/80 border-y border-cellar-700/80">
        {rows.slice(0, 8).map((r) => (
          <li key={r.label} className="flex items-baseline justify-between gap-2 py-2 text-sm">
            <span className="text-parchment-50">{r.label}</span>
            <span className="text-parchment-200/60">
              {r.bottles} btls · {money(r.value)}
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="py-4 text-parchment-200/50">No data</li>}
      </ul>
    </div>
  );
}
