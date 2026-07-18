import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-14 text-center animate-fade-up ${className}`}
    >
      <div className="mb-4 h-px w-16 bg-gradient-to-r from-transparent via-gold-500/70 to-transparent" />
      <h3 className="font-display text-2xl text-parchment-50">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-parchment-200/65">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
