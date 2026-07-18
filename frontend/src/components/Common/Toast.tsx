interface ToastProps {
  message: string;
  onDismiss?: () => void;
  tone?: 'gold' | 'alert';
  /** When false, renders in-flow for stacked toast hosts */
  fixed?: boolean;
}

export function Toast({ message, onDismiss, tone = 'gold', fixed = true }: ToastProps) {
  const toneClass =
    tone === 'alert'
      ? 'border-burgundy-500/50 bg-burgundy-700/90 text-parchment-50'
      : 'border-gold-500/40 bg-cellar-800/95 text-parchment-50';
  const positionClass = fixed ? 'fixed bottom-5 right-5 z-50' : 'relative';

  return (
    <div
      className={`${positionClass} max-w-sm animate-fade-up rounded-lg border px-4 py-3 text-sm shadow-panel backdrop-blur ${toneClass}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1">{message}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs uppercase tracking-wide text-parchment-200/70 hover:text-parchment-50"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
