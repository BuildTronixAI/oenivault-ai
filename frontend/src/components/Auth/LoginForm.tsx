import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function LoginForm() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="animate-fade-up-delay space-y-4">
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
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {(localError || error) && (
        <p className="text-sm text-burgundy-400">{localError || error}</p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-parchment-200/60">
        New here?{' '}
        <Link to="/signup" className="text-gold-400 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
