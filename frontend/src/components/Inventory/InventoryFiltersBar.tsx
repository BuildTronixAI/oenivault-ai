import type { InventoryFilters } from '../../hooks/useInventory';

interface Props {
  filters: InventoryFilters;
  regions: string[];
  varietals: string[];
  collections: { id: string; name: string }[];
  onChange: (next: InventoryFilters) => void;
}

export function InventoryFiltersBar({ filters, regions, varietals, collections, onChange }: Props) {
  function patch(partial: Partial<InventoryFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="grid grid-cols-1 gap-3 border border-cellar-700 bg-cellar-900/30 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <div className="md:col-span-2 lg:col-span-2">
        <label className="label-field" htmlFor="q">
          Search
        </label>
        <input
          id="q"
          className="input-field"
          placeholder="Name, region, location…"
          value={filters.q ?? ''}
          onChange={(e) => patch({ q: e.target.value })}
        />
      </div>
      <div>
        <label className="label-field" htmlFor="region">
          Region
        </label>
        <select
          id="region"
          className="input-field"
          value={filters.region ?? ''}
          onChange={(e) => patch({ region: e.target.value || undefined })}
        >
          <option value="">All</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-field" htmlFor="varietal">
          Varietal
        </label>
        <select
          id="varietal"
          className="input-field"
          value={filters.varietal ?? ''}
          onChange={(e) => patch({ varietal: e.target.value || undefined })}
        >
          <option value="">All</option>
          {varietals.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-field" htmlFor="collection">
          Collection
        </label>
        <select
          id="collection"
          className="input-field"
          value={filters.collectionId ?? ''}
          onChange={(e) => patch({ collectionId: e.target.value || undefined })}
        >
          <option value="">All</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-field" htmlFor="sort">
          Sort
        </label>
        <select
          id="sort"
          className="input-field"
          value={`${filters.sort ?? 'created'}:${filters.order ?? 'desc'}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split(':') as [string, 'asc' | 'desc'];
            patch({ sort, order });
          }}
        >
          <option value="created:desc">Newest</option>
          <option value="name:asc">Name A–Z</option>
          <option value="vintage:desc">Vintage ↓</option>
          <option value="value:desc">Value ↓</option>
          <option value="quantity:desc">Quantity ↓</option>
        </select>
      </div>
      <div className="flex items-end gap-2 md:col-span-3 lg:col-span-6">
        <div className="grid flex-1 grid-cols-2 gap-2">
          <div>
            <label className="label-field" htmlFor="vmin">
              Vintage from
            </label>
            <input
              id="vmin"
              type="number"
              className="input-field"
              value={filters.vintageMin ?? ''}
              onChange={(e) => patch({ vintageMin: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="vmax">
              Vintage to
            </label>
            <input
              id="vmax"
              type="number"
              className="input-field"
              value={filters.vintageMax ?? ''}
              onChange={(e) => patch({ vintageMax: e.target.value || undefined })}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            onChange({ sort: 'created', order: 'desc' })
          }
        >
          Clear
        </button>
      </div>
    </div>
  );
}
