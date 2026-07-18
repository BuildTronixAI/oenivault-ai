import { LoginForm } from '../components/Auth/LoginForm';
import { AuthShell } from '../components/Common/AuthShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function LoginPage() {
  useDocumentTitle('Sign in');
  return (
    <AuthShell
      tagline="Wine vault intelligence"
      subtitle="Sign in to manage collections and climate."
    >
      <LoginForm />
    </AuthShell>
  );
}
