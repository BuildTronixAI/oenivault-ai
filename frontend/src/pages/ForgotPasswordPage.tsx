import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, false);
      setMessage('If an account exists for that email, reset instructions have been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cellar-radial px-4">
      <div className="relative w-full max-w-md">
        <div className="mb-8 animate-fade-up text-center">
          <p className="font-display text-5xl font-semibold tracking-wide text-gold-400 md:text-6xl">
            OeniVault
          </p>
          <p className="mt-2 text-sm tracking-[0.2em] text-parchment-200/55 uppercase">
            Reset password
          </p>
          <p className="mt-4 text-parchment-200/70">
            Enter your email and we will send a reset link if an account exists.
          </p>
        </div>
        <form onSubmit={onSubmit} className="animate-fade-up-delay space-y-4">
          <div>
            <label htmlFor="forgot-email" className="label-field">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {message && <p className="text-sm text-gold-400">{message}</p>}
          {error && <p className="text-sm text-burgundy-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
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
