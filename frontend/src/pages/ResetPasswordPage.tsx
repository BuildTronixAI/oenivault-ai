import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { AuthShell } from '../components/Common/AuthShell';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token. Use the link from your email.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest(
        '/api/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ token, newPassword }),
        },
        false
      );
      setMessage('Password updated. Redirecting to sign in…');
      window.setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell tagline="Choose a new password">
      <form onSubmit={onSubmit} className="panel animate-fade-up-delay space-y-4 p-6">
        {!token && (
          <p className="text-sm text-burgundy-400">
            No token in the URL. Open the full link from your reset email.
          </p>
        )}
        <div>
          <label htmlFor="new-password" className="label-field">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="label-field">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input-field"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {message && <p className="text-sm text-gold-400">{message}</p>}
        {error && <p className="text-sm text-burgundy-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting || !token}>
          {submitting ? 'Updating…' : 'Reset password'}
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
