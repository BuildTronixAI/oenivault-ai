import { useState, type FormEvent } from 'react';
import type { Collection, WineInput } from '../../types';

interface Props {
  collections: Collection[];
  onSubmit: (input: WineInput) => Promise<void>;
  onCancel: () => void;
}

export function AddWine({ collections, onSubmit, onCancel }: Props) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? '');
  const [name, setName] = useState('');
  const [vintage, setVintage] = useState('');
  const [region, setRegion] = useState('');
  const [varietal, setVarietal] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [locationCode, setLocationCode] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!collectionId) {
      setError('Select a collection');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        collectionId,
        name,
        vintage: vintage ? Number(vintage) : null,
        region: region || null,
        varietal: varietal || null,
        quantity: Number(quantity) || 1,
        locationCode: locationCode || null,
        notes: notes || null,
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add wine');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-up space-y-4 border border-cellar-700 bg-cellar-900/40 p-4 md:p-6">
      <h2 className="font-display text-2xl text-gold-300">Add wine</h2>
      {collections.length === 0 && (
        <p className="text-sm text-burgundy-400">Create a collection first before adding wines.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label-field" htmlFor="collection">
            Collection
          </label>
          <select
            id="collection"
            className="input-field"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            required
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label-field" htmlFor="name">
            Name
          </label>
          <input id="name" className="input-field" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="vintage">
            Vintage
          </label>
          <input id="vintage" className="input-field" type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="quantity">
            Quantity
          </label>
          <input id="quantity" className="input-field" type="number" min={1} required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="region">
            Region
          </label>
          <input id="region" className="input-field" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="varietal">
            Varietal
          </label>
          <input id="varietal" className="input-field" value={varietal} onChange={(e) => setVarietal(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="location">
            Location code
          </label>
          <input id="location" className="input-field" placeholder="A-12-3" value={locationCode} onChange={(e) => setLocationCode(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="value">
            Est. value (USD)
          </label>
          <input id="value" className="input-field" type="number" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field" htmlFor="notes">
            Notes
          </label>
          <textarea id="notes" className="input-field min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-burgundy-400">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={submitting || collections.length === 0}>
          {submitting ? 'Saving…' : 'Save wine'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
