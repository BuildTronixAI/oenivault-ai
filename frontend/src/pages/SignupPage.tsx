import { SignupForm } from '../components/Auth/SignupForm';
import { AuthShell } from '../components/Common/AuthShell';

export function SignupPage() {
  return (
    <AuthShell tagline="Create your account" subtitle="Start a collection under OeniVault.">
      <SignupForm />
    </AuthShell>
  );
}
