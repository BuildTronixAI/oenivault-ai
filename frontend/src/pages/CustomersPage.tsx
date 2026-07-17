import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../services/api';
import type { User } from '../types';

export function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest<{ customers: User[] }>('/api/customers');
      setCustomers(res.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
      });
      setShowForm(false);
      setFullName('');
      setEmail('');
      setPassword('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-parchment-50 md:text-4xl">Customers</h1>
          <p className="mt-1 text-parchment-200/65">Manage facility clients and their access.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="grid max-w-xl gap-4 border border-cellar-700 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label-field" htmlFor="c-name">
              Full name
            </label>
            <input id="c-name" className="input-field" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label-field" htmlFor="c-email">
              Email
            </label>
            <input id="c-email" type="email" className="input-field" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label-field" htmlFor="c-pass">
              Temp password
            </label>
            <input id="c-pass" type="password" minLength={8} className="input-field" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="md:col-span-2 text-sm text-burgundy-400">{error}</p>}
          <button type="submit" className="btn-primary md:col-span-2" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create customer'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-md border border-cellar-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cellar-800/80 text-xs uppercase tracking-wide text-parchment-200/50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Collections</th>
              <th className="px-4 py-3 font-medium">Wines</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-cellar-700/80">
                <td className="px-4 py-3 text-parchment-50">{c.full_name}</td>
                <td className="px-4 py-3 text-parchment-200/70">{c.email}</td>
                <td className="px-4 py-3">{c.collection_count ?? 0}</td>
                <td className="px-4 py-3">{c.wine_count ?? 0}</td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-parchment-200/50">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
