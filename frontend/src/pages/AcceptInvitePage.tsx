import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { saveSession } from '../services/auth';
import type { AuthResponse } from '../types';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing invite token.');
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
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cellar-radial px-4">
      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="font-display text-5xl font-semibold text-gold-400">OeniVault</p>
          <p className="mt-2 text-parchment-200/70">Accept your invite</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="password">
              Choose a password
            </label>
            <input
              id="password"
              type="password"
              minLength={8}
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
      </div>
    </div>
  );
}
