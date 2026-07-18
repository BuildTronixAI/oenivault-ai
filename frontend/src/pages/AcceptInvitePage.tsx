import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { saveSession } from '../services/auth';
import type { AuthResponse } from '../types';
import { AuthShell } from '../components/Common/AuthShell';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { BrandLoader } from '../components/Common/BrandLoader';

export function AcceptInvitePage() {
  useDocumentTitle('Accept invite');
  const [params] = useSearchParams();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <BrandLoader label="Checking session…" />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing invite token.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiRequest<AuthResponse>(
        '/api/auth/accept-invite',
        { method: 'POST', body: JSON.stringify({ token, password }) },
        false
      );
      saveSession(data);
      window.location.assign('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return (
      <AuthShell
        tagline="Accept your invite"
        subtitle="You’re already signed in. Switch accounts to accept this invite."
      >
        <div className="panel animate-fade-up-delay space-y-4 p-6">
          <p className="text-sm text-parchment-200/75">
            Signed in as <span className="text-parchment-50">{user?.email}</span>. Accepting an invite
            creates a different account, so sign out first.
          </p>
          {!token && <p className="text-sm text-burgundy-400">Missing invite token in the URL.</p>}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => void logout()}
          >
            Sign out to accept invite
          </button>
          <p className="text-center text-sm text-parchment-200/60">
            <Link to="/dashboard" className="text-gold-400 hover:underline">
              Stay signed in
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell tagline="Accept your invite" subtitle="Set a password to join the vault.">
      <form onSubmit={onSubmit} className="panel animate-fade-up-delay space-y-4 p-6">
        {!token && (
          <p className="text-sm text-burgundy-400">Missing invite token in the URL.</p>
        )}
        <div>
          <label className="label-field" htmlFor="password">
            Choose a password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-parchment-200/50">At least 8 characters.</p>
        </div>
        <div>
          <label className="label-field" htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input-field"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-burgundy-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting || !token}>
          {submitting ? 'Creating…' : 'Join OeniVault'}
        </button>
        <p className="text-center text-sm text-parchment-200/60">
          <Link to="/login" className="text-gold-400 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
