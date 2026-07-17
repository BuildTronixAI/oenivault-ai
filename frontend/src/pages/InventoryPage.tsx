import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInventory } from '../hooks/useInventory';
import { WineList } from '../components/Inventory/WineList';
import { AddWine } from '../components/Inventory/AddWine';
import { WineDetail } from '../components/Inventory/WineDetail';
import { InventoryFiltersBar } from '../components/Inventory/InventoryFiltersBar';
import { PageHeader } from '../components/Common/PageHeader';
import { Toast } from '../components/Common/Toast';
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
    error,
    addWine,
    createCollection,
    updateWine,
    deleteWine,
    importCsv,
    valuateWine,
    downloadExport,
    refresh,
  } = useInventory();
  const [mode, setMode] = useState<'list' | 'add' | 'edit' | 'collection' | 'import'>('list');
  const [selected, setSelected] = useState<Wine | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [importCollectionId, setImportCollectionId] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 4000);
  }

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

  async function handleImportFile(file: File) {
    const collectionId = importCollectionId || collections[0]?.id;
    if (!collectionId) {
      setImportError('Select a collection first.');
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const csv = await file.text();
      const res = await importCsv(csv, collectionId);
      const count = res.imported ?? res.created ?? res.wines?.length;
      showToast(
        res.message ??
          (count != null ? `Imported ${count} wine(s).` : 'CSV import complete.')
      );
      await refresh();
      setMode('list');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="relative space-y-6 animate-fade-in">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <PageHeader
        title="Inventory"
        description={isAdmin ? 'All wines across the facility.' : 'Your collection only.'}
        actions={
          mode === 'list' ? (
            <>
              <button type="button" className="btn-secondary" onClick={() => void handleExport('csv')}>
                Export CSV
              </button>
              <button type="button" className="btn-secondary" onClick={() => void handleExport('pdf')}>
                Export PDF
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setImportCollectionId(collections[0]?.id ?? '');
                  setImportError(null);
                  setMode('import');
                }}
              >
                Import CSV
              </button>
              {!isAdmin && (
                <button type="button" className="btn-secondary" onClick={() => setMode('collection')}>
                  New collection
                </button>
              )}
              <button type="button" className="btn-primary" onClick={() => setMode('add')}>
                Add wine
              </button>
            </>
          ) : undefined
        }
      />

      {error && (
        <div className="rounded-md border border-burgundy-500/40 bg-burgundy-700/20 px-4 py-3 text-sm text-burgundy-400">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}
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

      {mode === 'import' && (
        <div className="max-w-md space-y-4 border border-cellar-700 bg-cellar-900/40 p-4 md:p-6">
          <h2 className="font-display text-2xl text-gold-300">Import CSV</h2>
          <p className="text-sm text-parchment-200/60">
            Upload a CSV with columns such as name, vintage, region, varietal, quantity. Rows are
            imported into the selected collection.
          </p>
          <div>
            <label className="label-field" htmlFor="import-coll">
              Collection
            </label>
            <select
              id="import-coll"
              className="input-field"
              value={importCollectionId}
              onChange={(e) => setImportCollectionId(e.target.value)}
              required
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAdmin && c.customer_name ? `${c.name} · ${c.customer_name}` : c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="csv-file">
              CSV file
            </label>
            <input
              id="csv-file"
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="input-field file:mr-3 file:border-0 file:bg-transparent file:text-sm file:text-gold-400"
              disabled={importing || collections.length === 0}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
              }}
            />
          </div>
          {importError && <p className="text-sm text-burgundy-400">{importError}</p>}
          {collections.length === 0 && (
            <p className="text-sm text-burgundy-400">Create a collection before importing.</p>
          )}
          <button type="button" className="btn-secondary" onClick={() => setMode('list')}>
            Cancel
          </button>
        </div>
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
        <AddWine
          collections={collections}
          isAdmin={isAdmin}
          onSubmit={handleAdd}
          onCancel={() => setMode('list')}
        />
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
            onAdd={() => setMode('add')}
            onSelect={(w) => {
              setSelected(w);
              setMode('edit');
            }}
            onDelete={async (id) => {
              try {
                const res = await deleteWine(id);
                if (res?.softDeleted || res?.archived || res?.deleted_at) {
                  showToast('Archived');
                }
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Delete failed');
              }
            }}
          />
        </>
      )}
    </div>
  );
}
