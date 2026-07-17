import { useState, type FormEvent } from 'react';
import type { Wine, WineInput } from '../../types';

interface Props {
  wine: Wine;
  onSave: (id: string, input: Partial<WineInput>) => Promise<void>;
  onClose: () => void;
}

export function WineDetail({ wine, onSave, onClose }: Props) {
  const [name, setName] = useState(wine.name);
  const [vintage, setVintage] = useState(wine.vintage?.toString() ?? '');
  const [region, setRegion] = useState(wine.region ?? '');
  const [varietal, setVarietal] = useState(wine.varietal ?? '');
  const [quantity, setQuantity] = useState(String(wine.quantity));
  const [locationCode, setLocationCode] = useState(wine.location_code ?? '');
  const [notes, setNotes] = useState(wine.notes ?? '');
  const [estimatedValue, setEstimatedValue] = useState(
    wine.estimated_value != null ? String(wine.estimated_value) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSave(wine.id, {
        name,
        vintage: vintage ? Number(vintage) : null,
        region: region || null,
        varietal: varietal || null,
        quantity: Number(quantity) || 1,
        locationCode: locationCode || null,
        notes: notes || null,
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-up space-y-4 border border-cellar-700 bg-cellar-900/40 p-4 md:p-6">
      <h2 className="font-display text-2xl text-gold-300">Edit wine</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label-field" htmlFor="edit-name">
            Name
          </label>
          <input id="edit-name" className="input-field" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="edit-vintage">
            Vintage
          </label>
          <input id="edit-vintage" className="input-field" type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="edit-qty">
            Quantity
          </label>
          <input id="edit-qty" className="input-field" type="number" min={1} required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="edit-region">
            Region
          </label>
          <input id="edit-region" className="input-field" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="edit-varietal">
            Varietal
          </label>
          <input id="edit-varietal" className="input-field" value={varietal} onChange={(e) => setVarietal(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="edit-loc">
            Location
          </label>
          <input id="edit-loc" className="input-field" value={locationCode} onChange={(e) => setLocationCode(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="edit-value">
            Est. value
          </label>
          <input id="edit-value" className="input-field" type="number" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label-field" htmlFor="edit-notes">
            Notes
          </label>
          <textarea id="edit-notes" className="input-field min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-burgundy-400">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </form>
  );
}
