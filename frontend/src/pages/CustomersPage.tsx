import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';

export function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteFacilityId, setInviteFacilityId] = useState('');
  const [inviteInfo, setInviteInfo] = useState<string | null>(null);
  const [inviteTokenOnce, setInviteTokenOnce] = useState<string | null>(null);
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

  useEffect(() => {
    if (user?.facility_id) setInviteFacilityId(user.facility_id);
  }, [user?.facility_id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiRequest<{ customer: User }>('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          facilityId: user?.facility_id ?? null,
        }),
      });

      const name = collectionName.trim() || `${fullName}'s Collection`;
      if (user?.facility_id && created.customer?.id) {
        await apiRequest('/api/collections', {
          method: 'POST',
          body: JSON.stringify({
            customerId: created.customer.id,
            facilityId: user.facility_id,
            name,
          }),
        });
      }

      setShowForm(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setCollectionName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInviteInfo(null);
    setInviteTokenOnce(null);
    try {
      const facilityId = inviteFacilityId.trim() || user?.facility_id || '';
      if (!facilityId) {
        setError('Facility ID is required to send an invite.');
        return;
      }
      const res = await apiRequest<{
        invite?: { id?: string; email?: string; expiresAt?: string };
        inviteToken?: string;
        message?: string;
      }>('/api/customers/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          fullName: inviteFullName,
          facilityId,
        }),
      });
      const parts = [
        res.message,
        res.invite?.email ? `Invited ${res.invite.email}` : `Invite sent to ${inviteEmail}`,
        res.invite?.expiresAt
          ? `Expires ${new Date(res.invite.expiresAt).toLocaleString()}`
          : null,
      ].filter(Boolean);
      setInviteInfo(parts.join(' · '));
      if (res.inviteToken) setInviteTokenOnce(res.inviteToken);
      setInviteEmail('');
      setInviteFullName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowInvite((v) => !v);
              setShowForm(false);
              setError(null);
            }}
          >
            {showInvite ? 'Cancel invite' : 'Invite customer'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setShowForm((v) => !v);
              setShowInvite(false);
              setError(null);
            }}
          >
            {showForm ? 'Cancel' : 'Add customer'}
          </button>
        </div>
      </div>

      {showInvite && (
        <form onSubmit={onInvite} className="grid max-w-xl gap-4 border border-cellar-700 p-4 md:grid-cols-2">
          <h2 className="font-display text-xl text-gold-300 md:col-span-2">Invite customer</h2>
          <div className="md:col-span-2">
            <label className="label-field" htmlFor="inv-name">
              Full name
            </label>
            <input
              id="inv-name"
              className="input-field"
              required
              value={inviteFullName}
              onChange={(e) => setInviteFullName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-field" htmlFor="inv-email">
              Email
            </label>
            <input
              id="inv-email"
              type="email"
              className="input-field"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-field" htmlFor="inv-facility">
              Facility ID
            </label>
            <input
              id="inv-facility"
              className="input-field"
              required
              value={inviteFacilityId}
              onChange={(e) => setInviteFacilityId(e.target.value)}
              placeholder="Defaults to your facility"
            />
          </div>
          {inviteInfo && <p className="md:col-span-2 text-sm text-gold-400">{inviteInfo}</p>}
          {inviteTokenOnce && (
            <div className="md:col-span-2 rounded border border-gold-500/40 bg-cellar-900/60 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-gold-400">Dev invite token (shown once)</p>
              <p className="mt-1 break-all font-mono text-parchment-50">{inviteTokenOnce}</p>
            </div>
          )}
          {error && <p className="md:col-span-2 text-sm text-burgundy-400">{error}</p>}
          <button type="submit" className="btn-primary md:col-span-2" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="grid max-w-xl gap-4 border border-cellar-700 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label-field" htmlFor="c-name">
              Full name
            </label>
            <input
              id="c-name"
              className="input-field"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="c-email">
              Email
            </label>
            <input
              id="c-email"
              type="email"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="c-pass">
              Temp password
            </label>
            <input
              id="c-pass"
              type="password"
              minLength={8}
              className="input-field"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-field" htmlFor="c-coll">
              Initial collection name
            </label>
            <input
              id="c-coll"
              className="input-field"
              placeholder="Optional — defaults to Name's Collection"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
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
