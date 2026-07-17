import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInventory } from '../hooks/useInventory';
import { WineList } from '../components/Inventory/WineList';
import { AddWine } from '../components/Inventory/AddWine';
import { WineDetail } from '../components/Inventory/WineDetail';
import { InventoryFiltersBar } from '../components/Inventory/InventoryFiltersBar';
import type { Wine, WineInput } from '../types';

export function InventoryPage() {
  const { user, isAdmin } = useAuth();
  const {
    wines,
    collections,
    filterOptions,
    filters,
    setFilters,
    loading,
    addWine,
    createCollection,
    updateWine,
    deleteWine,
    valuateWine,
    downloadExport,
    refresh,
  } = useInventory();
  const [mode, setMode] = useState<'list' | 'add' | 'edit' | 'collection'>('list');
  const [selected, setSelected] = useState<Wine | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleAdd(input: WineInput) {
    await addWine(input);
    await refresh();
    setMode('list');
  }

  async function handleUpdate(id: string, input: Partial<WineInput>) {
    await updateWine(id, input);
    await refresh();
  }

  async function handleCreateCollection(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const facilityId = user.facility_id;
    if (!facilityId) {
      setCollectionError('Your account has no facility assigned. Ask an admin to link one.');
      return;
    }
    setCreatingCollection(true);
    setCollectionError(null);
    try {
      await createCollection({
        customerId: user.id,
        facilityId,
        name: collectionName.trim(),
      });
      await refresh();
      setCollectionName('');
      setMode('list');
    } catch (err) {
      setCollectionError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setCreatingCollection(false);
    }
  }

  async function handleExport(format: 'csv' | 'pdf') {
    setExportError(null);
    try {
      await downloadExport(format);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-parchment-50 md:text-4xl">Inventory</h1>
          <p className="mt-1 text-parchment-200/65">
            {isAdmin ? 'All wines across the facility.' : 'Your collection only.'}
          </p>
        </div>
        {mode === 'list' && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => void handleExport('csv')}>
              Export CSV
            </button>
            <button type="button" className="btn-secondary" onClick={() => void handleExport('pdf')}>
              Export PDF
            </button>
            {!isAdmin && (
              <button type="button" className="btn-secondary" onClick={() => setMode('collection')}>
                New collection
              </button>
            )}
            <button type="button" className="btn-primary" onClick={() => setMode('add')}>
              Add wine
            </button>
          </div>
        )}
      </div>

      {exportError && <p className="text-sm text-burgundy-400">{exportError}</p>}

      {mode === 'list' && (
        <InventoryFiltersBar
          filters={filters}
          regions={filterOptions.regions}
          varietals={filterOptions.varietals}
          collections={collections}
          onChange={setFilters}
        />
      )}

      {mode === 'collection' && (
        <form
          onSubmit={handleCreateCollection}
          className="max-w-md space-y-4 border border-cellar-700 bg-cellar-900/40 p-4 md:p-6"
        >
          <h2 className="font-display text-2xl text-gold-300">New collection</h2>
          <div>
            <label className="label-field" htmlFor="coll-name">
              Name
            </label>
            <input
              id="coll-name"
              className="input-field"
              required
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Private Cellar"
            />
          </div>
          {collectionError && <p className="text-sm text-burgundy-400">{collectionError}</p>}
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={creatingCollection}>
              {creatingCollection ? 'Creating…' : 'Create'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode('list')}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'add' && (
        <AddWine collections={collections} onSubmit={handleAdd} onCancel={() => setMode('list')} />
      )}

      {mode === 'edit' && selected && (
        <WineDetail
          wine={selected}
          onSave={handleUpdate}
          onValuate={valuateWine}
          onClose={() => {
            setSelected(null);
            setMode('list');
          }}
        />
      )}

      {mode === 'list' && (
        <>
          <p className="text-sm text-parchment-200/50">{loading ? 'Loading…' : `${wines.length} wines`}</p>
          <WineList
            wines={wines}
            loading={loading}
            isAdmin={isAdmin}
            onSelect={(w) => {
              setSelected(w);
              setMode('edit');
            }}
            onDelete={async (id) => {
              await deleteWine(id);
            }}
          />
        </>
      )}
    </div>
  );
}
