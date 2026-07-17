import { LoginForm } from '../components/Auth/LoginForm';
import { AuthShell } from '../components/Common/AuthShell';

export function LoginPage() {
  return (
    <AuthShell
      tagline="Wine vault intelligence"
      subtitle="Sign in to manage collections and climate."
    >
      <LoginForm />
    </AuthShell>
  );
}
