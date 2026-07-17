import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';

interface AuthShellProps {
  tagline: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthShell({ tagline, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cellar-radial px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] bg-cellar-lattice" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-burgundy-500/20 blur-3xl animate-drift" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl animate-drift-slow" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 animate-fade-up text-center">
          <BrandMark size="lg" tagline={tagline} />
          {subtitle ? <p className="mt-4 text-parchment-200/70">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
