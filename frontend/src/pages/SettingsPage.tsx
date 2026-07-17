import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

interface NotificationPreferences {
  email_alerts: boolean;
  email_digest: boolean;
  in_app_alerts: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  email_alerts: true,
  email_digest: false,
  in_app_alerts: true,
};

export function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsUnavailable, setPrefsUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPrefs() {
      setPrefsLoading(true);
      setPrefsError(null);
      setPrefsUnavailable(false);
      try {
        const res = await apiRequest<{ preferences?: NotificationPreferences } & NotificationPreferences>(
          '/api/preferences'
        );
        const next = res.preferences ?? res;
        if (!cancelled) {
          setPrefs({
            email_alerts: Boolean(next.email_alerts ?? DEFAULT_PREFS.email_alerts),
            email_digest: Boolean(next.email_digest ?? DEFAULT_PREFS.email_digest),
            in_app_alerts: Boolean(next.in_app_alerts ?? DEFAULT_PREFS.in_app_alerts),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setPrefsUnavailable(true);
          setPrefsError(err instanceof Error ? err.message : 'Preferences unavailable');
        }
      } finally {
        if (!cancelled) setPrefsLoading(false);
      }
    }
    void loadPrefs();
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function onSavePrefs(e: FormEvent) {
    e.preventDefault();
    setPrefsSaving(true);
    setPrefsMessage(null);
    setPrefsError(null);
    try {
      const res = await apiRequest<{ preferences?: NotificationPreferences } & NotificationPreferences>(
        '/api/preferences',
        {
          method: 'PATCH',
          body: JSON.stringify(prefs),
        }
      );
      const next = res.preferences ?? res;
      setPrefs({
        email_alerts: Boolean(next.email_alerts ?? prefs.email_alerts),
        email_digest: Boolean(next.email_digest ?? prefs.email_digest),
        in_app_alerts: Boolean(next.in_app_alerts ?? prefs.in_app_alerts),
      });
      setPrefsUnavailable(false);
      setPrefsMessage('Notification preferences saved.');
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setPrefsSaving(false);
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

      <form onSubmit={onSavePrefs} className="space-y-4 border-t border-cellar-700 pt-6">
        <h2 className="font-display text-xl text-gold-300">Notification preferences</h2>
        {prefsLoading ? (
          <p className="text-sm text-parchment-200/50">Loading preferences…</p>
        ) : prefsUnavailable ? (
          <p className="text-sm text-parchment-200/55">
            Notification preferences are not available yet. You can still change your password above.
            {prefsError ? ` (${prefsError})` : ''}
          </p>
        ) : (
          <>
            <label className="flex items-center gap-3 text-sm text-parchment-100">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-cellar-600 bg-cellar-900 text-burgundy-600"
                checked={prefs.email_alerts}
                onChange={(e) => setPrefs((p) => ({ ...p, email_alerts: e.target.checked }))}
              />
              Email alerts for climate issues
            </label>
            <label className="flex items-center gap-3 text-sm text-parchment-100">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-cellar-600 bg-cellar-900 text-burgundy-600"
                checked={prefs.email_digest}
                onChange={(e) => setPrefs((p) => ({ ...p, email_digest: e.target.checked }))}
              />
              Weekly email digest
            </label>
            <label className="flex items-center gap-3 text-sm text-parchment-100">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-cellar-600 bg-cellar-900 text-burgundy-600"
                checked={prefs.in_app_alerts}
                onChange={(e) => setPrefs((p) => ({ ...p, in_app_alerts: e.target.checked }))}
              />
              In-app alert toasts
            </label>
          </>
        )}
        {prefsMessage && <p className="text-sm text-gold-400">{prefsMessage}</p>}
        {prefsError && !prefsUnavailable && (
          <p className="text-sm text-burgundy-400">{prefsError}</p>
        )}
        {!prefsLoading && (
          <button type="submit" className="btn-primary" disabled={prefsSaving || prefsUnavailable}>
            {prefsSaving ? 'Saving…' : 'Save preferences'}
          </button>
        )}
      </form>
    </div>
  );
}
