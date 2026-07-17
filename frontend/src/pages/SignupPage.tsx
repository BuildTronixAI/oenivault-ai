import { SignupForm } from '../components/Auth/SignupForm';

export function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cellar-radial px-4">
      <div className="relative w-full max-w-md">
        <div className="mb-8 animate-fade-up text-center">
          <p className="font-display text-5xl font-semibold tracking-wide text-gold-400 md:text-6xl">
            OeniVault
          </p>
          <p className="mt-2 text-sm tracking-[0.2em] text-parchment-200/55 uppercase">
            Create your account
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
