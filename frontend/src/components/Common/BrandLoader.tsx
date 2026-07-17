import { BrandMark } from './BrandMark';

export function BrandLoader({ label = 'Opening the vault…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cellar-radial px-4">
      <div className="animate-fade-in text-center">
        <BrandMark size="md" />
        <p className="mt-4 text-sm text-parchment-200/55">{label}</p>
        <div className="mx-auto mt-6 h-0.5 w-28 overflow-hidden rounded-full bg-cellar-700">
          <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        </div>
      </div>
    </div>
  );
}
