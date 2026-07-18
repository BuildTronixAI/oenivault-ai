import type { Wine } from '../../types';
import { formatMoney } from '../../utils/format';
import { EmptyState } from '../Common/EmptyState';

interface Props {
  wines: Wine[];
  loading: boolean;
  isAdmin: boolean;
  onSelect: (wine: Wine) => void;
  onArchive: (wine: Wine) => void;
  onAdd?: () => void;
}

export function WineList({ wines, loading, isAdmin, onSelect, onArchive, onAdd }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-cellar-800/70" />
        ))}
      </div>
    );
  }

  if (wines.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          title="No wines in view"
          description="Adjust filters or add a bottle to start building this collection."
          action={
            onAdd ? (
              <button type="button" className="btn-primary" onClick={onAdd}>
                Add wine
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">Wine inventory</caption>
        <thead className="bg-cellar-800/80 text-xs uppercase tracking-wide text-parchment-200/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Wine
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Vintage
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Location
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Qty
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Est. / bottle
            </th>
            {isAdmin && (
              <th scope="col" className="px-4 py-3 font-medium">
                Owner
              </th>
            )}
            <th scope="col" className="px-4 py-3 font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {wines.map((w) => (
            <tr
              key={w.id}
              className="border-t border-cellar-700/80 transition hover:bg-cellar-800/40"
            >
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onSelect(w)}
                  className="text-left font-medium text-parchment-50 hover:text-gold-300"
                >
                  {w.name}
                </button>
                <p className="text-xs text-parchment-200/50">
                  {[w.region, w.varietal].filter(Boolean).join(' · ')}
                </p>
              </td>
              <td className="px-4 py-3">{w.vintage ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-xs">{w.location_code ?? '—'}</td>
              <td className="px-4 py-3">{w.quantity}</td>
              <td className="px-4 py-3">
                {w.estimated_value != null
                  ? formatMoney(Number(w.estimated_value), { maximumFractionDigits: 2 })
                  : '—'}
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-parchment-200/70">{w.customer_name ?? '—'}</td>
              )}
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(w)}
                    className="text-xs text-gold-400 hover:underline focus-visible:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchive(w)}
                    className="text-xs text-burgundy-400 hover:underline focus-visible:underline"
                  >
                    Archive
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
