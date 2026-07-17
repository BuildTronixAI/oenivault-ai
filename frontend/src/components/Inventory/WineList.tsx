import type { Wine } from '../../types';

function formatValue(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

interface Props {
  wines: Wine[];
  loading: boolean;
  isAdmin: boolean;
  onSelect: (wine: Wine) => void;
  onDelete: (id: string) => void;
}

export function WineList({ wines, loading, isAdmin, onSelect, onDelete }: Props) {
  if (loading) {
    return <p className="text-sm text-parchment-200/50">Loading inventory…</p>;
  }

  if (wines.length === 0) {
    return <p className="py-10 text-center text-parchment-200/50">No wines found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-cellar-700">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-cellar-800/80 text-xs uppercase tracking-wide text-parchment-200/50">
          <tr>
            <th className="px-4 py-3 font-medium">Wine</th>
            <th className="px-4 py-3 font-medium">Vintage</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Qty</th>
            <th className="px-4 py-3 font-medium">Value</th>
            {isAdmin && <th className="px-4 py-3 font-medium">Owner</th>}
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {wines.map((w) => (
            <tr key={w.id} className="border-t border-cellar-700/80">
              <td className="px-4 py-3">
                <button type="button" onClick={() => onSelect(w)} className="text-left font-medium text-parchment-50 hover:text-gold-300">
                  {w.name}
                </button>
                <p className="text-xs text-parchment-200/50">{[w.region, w.varietal].filter(Boolean).join(' · ')}</p>
              </td>
              <td className="px-4 py-3">{w.vintage ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-xs">{w.location_code ?? '—'}</td>
              <td className="px-4 py-3">{w.quantity}</td>
              <td className="px-4 py-3">{w.estimated_value != null ? formatValue(Number(w.estimated_value)) : '—'}</td>
              {isAdmin && <td className="px-4 py-3 text-parchment-200/70">{w.customer_name ?? '—'}</td>}
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button type="button" onClick={() => onSelect(w)} className="text-xs text-gold-400 hover:underline">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${w.name}?`)) void onDelete(w.id);
                    }}
                    className="text-xs text-burgundy-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
