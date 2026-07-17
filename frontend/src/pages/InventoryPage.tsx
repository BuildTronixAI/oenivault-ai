import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInventory } from '../hooks/useInventory';
import { WineList } from '../components/Inventory/WineList';
import { AddWine } from '../components/Inventory/AddWine';
import { WineDetail } from '../components/Inventory/WineDetail';
import type { Wine, WineInput } from '../types';

export function InventoryPage() {
  const { isAdmin } = useAuth();
  const { wines, collections, loading, addWine, updateWine, deleteWine, refresh } = useInventory();
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selected, setSelected] = useState<Wine | null>(null);

  async function handleAdd(input: WineInput) {
    await addWine(input);
    await refresh();
    setMode('list');
  }

  async function handleUpdate(id: string, input: Partial<WineInput>) {
    await updateWine(id, input);
    await refresh();
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
          <button type="button" className="btn-primary" onClick={() => setMode('add')}>
            Add wine
          </button>
        )}
      </div>

      {mode === 'add' && (
        <AddWine
          collections={collections}
          onSubmit={handleAdd}
          onCancel={() => setMode('list')}
        />
      )}

      {mode === 'edit' && selected && (
        <WineDetail
          wine={selected}
          onSave={handleUpdate}
          onClose={() => {
            setSelected(null);
            setMode('list');
          }}
        />
      )}

      {mode === 'list' && (
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
      )}
    </div>
  );
}
