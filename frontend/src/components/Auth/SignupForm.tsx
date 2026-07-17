import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await signup(fullName, email, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="animate-fade-up-delay space-y-4">
      <div>
        <label htmlFor="fullName" className="label-field">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          required
          className="input-field"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
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
        <label htmlFor="password" className="label-field">
          Password
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
      </div>
      {localError && <p className="text-sm text-burgundy-400">{localError}</p>}
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-parchment-200/60">
        Already have an account?{' '}
        <Link to="/login" className="text-gold-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
