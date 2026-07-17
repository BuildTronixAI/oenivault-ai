import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

export function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-semibold text-parchment-50 md:text-4xl">Settings</h1>
        <p className="mt-1 text-parchment-200/65">Profile and account preferences.</p>
      </div>
      <dl className="space-y-4 border-t border-cellar-700 pt-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-parchment-200/50">Name</dt>
          <dd className="mt-1 text-parchment-50">{user?.full_name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-parchment-200/50">Email</dt>
          <dd className="mt-1 text-parchment-50">{user?.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-parchment-200/50">Role</dt>
          <dd className="mt-1 capitalize text-parchment-50">{user?.role}</dd>
        </div>
      </dl>

      <form onSubmit={onChangePassword} className="space-y-4 border-t border-cellar-700 pt-6">
        <h2 className="font-display text-xl text-gold-300">Change password</h2>
        <div>
          <label className="label-field" htmlFor="current">
            Current password
          </label>
          <input
            id="current"
            type="password"
            required
            className="input-field"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="next">
            New password
          </label>
          <input
            id="next"
            type="password"
            minLength={8}
            required
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {message && <p className="text-sm text-gold-400">{message}</p>}
        {error && <p className="text-sm text-burgundy-400">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
