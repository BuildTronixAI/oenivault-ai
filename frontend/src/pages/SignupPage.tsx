import { SignupForm } from '../components/Auth/SignupForm';
import { AuthShell } from '../components/Common/AuthShell';

export function SignupPage() {
  return (
    <AuthShell
      tagline="Create your account"
      subtitle="Self-serve signup for demos. Production vaults usually invite collectors."
    >
      <SignupForm />
    </AuthShell>
  );
}
