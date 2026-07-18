import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';
import { PageHeader } from '../components/Common/PageHeader';
import { FacilitySelect } from '../components/Common/FacilitySelect';
import { EmptyState } from '../components/Common/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';

export function CustomersPage() {
  useDocumentTitle('Customers');
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
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
  const [inviteLinkOnce, setInviteLinkOnce] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiRequest<{ customers: User[] }>('/api/customers');
      setCustomers(res.customers);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load');
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
    setCreateError(null);
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
      pushToast('Customer created.');
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setInviteError(null);
    setInviteInfo(null);
    setInviteLinkOnce(null);
    try {
      const facilityId = inviteFacilityId.trim() || user?.facility_id || '';
      if (!facilityId) {
        setInviteError('Select a facility to send an invite.');
        return;
      }
      const res = await apiRequest<{
        invite?: { id?: string; email?: string; expires_at?: string; expiresAt?: string };
        inviteToken?: string;
        inviteLink?: string;
        message?: string;
      }>('/api/customers/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          fullName: inviteFullName,
          facilityId,
        }),
      });
      const expires = res.invite?.expires_at ?? res.invite?.expiresAt;
      const parts = [
        res.message,
        res.invite?.email ? `Invited ${res.invite.email}` : `Invite sent to ${inviteEmail}`,
        expires ? `Expires ${new Date(expires).toLocaleString()}` : null,
      ].filter(Boolean);
      setInviteInfo(parts.join(' · '));
      const link =
        res.inviteLink ||
        (res.inviteToken
          ? `${window.location.origin}/accept-invite?token=${res.inviteToken}`
          : null);
      if (link) setInviteLinkOnce(link);
      setInviteEmail('');
      setInviteFullName('');
      pushToast('Invite sent.');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.full_name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Customers"
        description="Invite collectors or create accounts with a temporary password."
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowInvite((v) => !v);
                setShowForm(false);
                setInviteError(null);
                setCreateError(null);
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
                setInviteError(null);
                setCreateError(null);
              }}
            >
              {showForm ? 'Cancel' : 'Add customer'}
            </button>
          </>
        }
      />

      {loadError && (
        <div className="rounded-md border border-burgundy-500/40 bg-burgundy-700/20 px-4 py-3 text-sm text-burgundy-400">
          {loadError}{' '}
          <button type="button" className="underline" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {showInvite && (
        <form onSubmit={onInvite} className="panel grid max-w-xl gap-4 p-4 md:grid-cols-2 md:p-6">
          <h2 className="font-display text-xl text-gold-300 md:col-span-2">Invite customer</h2>
          <p className="md:col-span-2 text-sm text-parchment-200/60">
            Preferred for production: the collector sets their own password via email link.
          </p>
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
            <FacilitySelect
              id="inv-facility"
              value={inviteFacilityId}
              onChange={setInviteFacilityId}
              required
            />
          </div>
          {inviteInfo && <p className="md:col-span-2 text-sm text-gold-400">{inviteInfo}</p>}
          {inviteLinkOnce && (
            <div className="md:col-span-2 rounded border border-gold-500/40 bg-cellar-900/60 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-gold-400">Invite link (copy once)</p>
              <a
                href={inviteLinkOnce}
                className="mt-1 block break-all text-parchment-50 hover:text-gold-300"
              >
                {inviteLinkOnce}
              </a>
              <button
                type="button"
                className="btn-secondary mt-3 !py-1.5 !text-xs"
                onClick={() => void navigator.clipboard.writeText(inviteLinkOnce)}
              >
                Copy link
              </button>
            </div>
          )}
          {inviteError && <p className="md:col-span-2 text-sm text-burgundy-400">{inviteError}</p>}
          <button type="submit" className="btn-primary md:col-span-2" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="panel grid max-w-xl gap-4 p-4 md:grid-cols-2 md:p-6">
          <h2 className="font-display text-xl text-gold-300 md:col-span-2">Add customer</h2>
          <p className="md:col-span-2 text-sm text-parchment-200/60">
            Creates an account immediately with a temporary password. Prefer Invite when email is
            available.
          </p>
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
          {createError && <p className="md:col-span-2 text-sm text-burgundy-400">{createError}</p>}
          <button type="submit" className="btn-primary md:col-span-2" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create customer'}
          </button>
        </form>
      )}

      <div>
        <label className="label-field" htmlFor="customer-q">
          Search
        </label>
        <input
          id="customer-q"
          className="input-field max-w-md"
          placeholder="Name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="panel overflow-x-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-cellar-800/70" />
            ))}
          </div>
        ) : (
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
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-cellar-700/80 transition hover:bg-cellar-800/40">
                  <td className="px-4 py-3 text-parchment-50">{c.full_name}</td>
                  <td className="px-4 py-3 text-parchment-200/70">{c.email}</td>
                  <td className="px-4 py-3">{c.collection_count ?? 0}</td>
                  <td className="px-4 py-3">{c.wine_count ?? 0}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title={query ? 'No matches' : 'No customers yet'}
                      description={
                        query
                          ? 'Try a different name or email.'
                          : 'Invite a collector to open their first collection.'
                      }
                      action={
                        !query ? (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => {
                              setShowInvite(true);
                              setShowForm(false);
                            }}
                          >
                            Invite customer
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
