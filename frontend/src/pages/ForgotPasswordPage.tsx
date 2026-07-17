import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { AuthShell } from '../components/Common/AuthShell';

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
      await apiRequest(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        },
        false
      );
      setMessage('If an account exists for that email, reset instructions have been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      tagline="Reset password"
      subtitle="Enter your email and we will send a reset link if an account exists."
    >
      <form onSubmit={onSubmit} className="panel animate-fade-up-delay space-y-4 p-6">
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
    </AuthShell>
  );
}
