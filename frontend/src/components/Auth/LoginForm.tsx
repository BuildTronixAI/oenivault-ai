import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const expired = params.get('reason') === 'expired';
  const next = params.get('next');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await login(email, password);
      navigate(next && next.startsWith('/') ? next : '/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel animate-fade-up-delay space-y-4 p-6">
      {expired && (
        <p className="rounded-md border border-gold-500/30 bg-cellar-950/40 px-3 py-2 text-sm text-gold-300">
          Your session expired. Please sign in again.
        </p>
      )}
      <div>
        <label htmlFor="email" className="label-field">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="password" className="label-field !mb-0">
            Password
          </label>
          <Link to="/forgot-password" className="text-xs text-gold-400 hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="input-field pr-20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gold-400 hover:underline"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {localError && <p className="text-sm text-burgundy-400">{localError}</p>}
      <button type="submit" className="btn-primary w-full" disabled={submitting} aria-busy={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-parchment-200/60">
        New here?{' '}
        <Link to="/signup" className="text-gold-400 hover:underline">
          Create an account
        </Link>
        {' · '}
        Have an invite?{' '}
        <Link to="/accept-invite" className="text-gold-400 hover:underline">
          Accept invite
        </Link>
      </p>
    </form>
  );
}
