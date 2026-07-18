interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  tagline?: string;
  className?: string;
  showAi?: boolean;
}

const sizeClass = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-5xl md:text-6xl',
  hero: 'text-5xl md:text-7xl',
} as const;

export function BrandMark({
  size = 'md',
  tagline,
  className = '',
  showAi = true,
}: BrandMarkProps) {
  return (
    <div className={className}>
      <p className={`font-display font-semibold tracking-wide text-gold-400 ${sizeClass[size]}`}>
        OeniVault
        {showAi ? <span className="ml-1.5 text-parchment-100">AI</span> : null}
      </p>
      {tagline ? (
        <p className="mt-2 text-sm tracking-[0.22em] text-parchment-200/55 uppercase">{tagline}</p>
      ) : null}
    </div>
  );
}
